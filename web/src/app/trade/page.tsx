"use client";
import { useState, useEffect } from "react";
import { type Coin, type Candle } from "@/lib/coingecko";
import PriceChart from "./price-chart";
import CoinSearchList from "./coin-search-list";
import Holdings from "./holdings";
import {
  getHoldings,
  saveHolding,
  updateHolding,
  deleteHolding,
  getAccount,
  saveCash,
} from "./actions";

// a coin we can buy and its price
export type MarketCoin = {
  id: string;
  name: string;
  price: number;
};

// a coin we own and what we paid
export type Holding = {
  id: string;
  name: string;
  quantity: number;
  cost: number;
};

export default function TradePage() {
  const [cash, setCash] = useState(10000);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [coins, setCoins] = useState<MarketCoin[]>([]);
  const [amount, setAmount] = useState("100");
  const [sellAmount, setSellAmount] = useState("100");

  // get prices from our api and refresh every 30 seconds
  useEffect(() => {
    async function loadCoins() {
      const res = await fetch("/api/markets");
      const data: Coin[] = await res.json();
      const list: MarketCoin[] = [];
      for (let i = 0; i < data.length; i++) {
        list.push({ id: data[i].id, name: data[i].name, price: data[i].current_price });
      }
      setCoins(list);
    }
    loadCoins();
    const timer = setInterval(loadCoins, 30000);
    return () => clearInterval(timer);
  }, []);

  // grab our saved cash and coins when the page opens
  useEffect(() => {
    async function loadAccount() {
      const savedCash = await getAccount();
      setCash(savedCash);
      const savedHoldings = await getHoldings();
      setHoldings(savedHoldings);
    }
    loadAccount();
  }, []);

  const [selectedId, setSelectedId] = useState("");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [days, setDays] = useState(30);

  // nothing picked, show first coins chart
  let shownId = selectedId;
  if (shownId === "" && coins.length > 0) {
    shownId = coins[0].id;
  }

  // load the chart when the coin changes
  useEffect(() => {
    if (shownId === "") {
      return;
    }
    async function loadCandles() {
      const res = await fetch(`/api/ohlc?id=${shownId}&days=${days}`);
      const data: Candle[] = await res.json();
      setCandles(data);
    }
    loadCandles();
  }, [shownId, days]);

  async function buy(coin: MarketCoin) {
    const amountUsd = Number(amount);
    if (amountUsd <= 0 || cash < amountUsd) {
      return;
    }
    const quantity = amountUsd / coin.price;
    const newCash = cash - amountUsd;
    setCash(newCash);

    setHoldings((current) => {
      const updated: Holding[] = [];
      let alreadyOwned = false;
      // add to this coin if we already own it
      for (let i = 0; i < current.length; i++) {
        if (current[i].id === coin.id) {
          alreadyOwned = true;
          updated.push({
            id: current[i].id,
            name: current[i].name,
            quantity: current[i].quantity + quantity,
            cost: current[i].cost + amountUsd,
          });
        } else {
          updated.push(current[i]);
        }
      }
      // otherwise add it as a new holding
      if (!alreadyOwned) {
        updated.push({ id: coin.id, name: coin.name, quantity, cost: amountUsd });
      }
      return updated;
    });

    // save it
    await saveHolding(coin.id, coin.name, quantity, amountUsd);
    await saveCash(newCash);
  }

  async function sell(holding: Holding) {
    const amountUsd = Number(sellAmount);
    if (amountUsd <= 0) {
      return;
    }
    let coin: MarketCoin | undefined;
    for (let i = 0; i < coins.length; i++) {
      if (coins[i].id === holding.id) {
        coin = coins[i];
      }
    }
    if (!coin) {
      return;
    }

    // cant sell more than we actually own
    let quantity = amountUsd / coin.price;
    if (quantity > holding.quantity) {
      quantity = holding.quantity;
    }
    const proceeds = quantity * coin.price;
    const newCash = cash + proceeds;
    setCash(newCash);
    const partSold = quantity / holding.quantity;
    const quantityLeft = holding.quantity - quantity;
    const costLeft = holding.cost - holding.cost * partSold;

    setHoldings((current) => {
      const updated: Holding[] = [];
      for (let i = 0; i < current.length; i++) {
        if (current[i].id !== holding.id) {
          updated.push(current[i]);
        } else if (quantityLeft > 0.0000001) {
          // sold some of it, keep the rest
          updated.push({
            id: current[i].id,
            name: current[i].name,
            quantity: quantityLeft,
            cost: costLeft,
          });
        }
      }
      return updated;
    });

    // save it
    if (quantityLeft > 0.0000001) {
      await updateHolding(holding.id, quantityLeft, costLeft);
    } else {
      await deleteHolding(holding.id);
    }
    await saveCash(newCash);
  }

  // add up what all our holdings are worth
  let holdingsValue = 0;
  for (let i = 0; i < holdings.length; i++) {
    for (let j = 0; j < coins.length; j++) {
      if (coins[j].id === holdings[i].id) {
        holdingsValue += holdings[i].quantity * coins[j].price;
      }
    }
  }
  const totalValue = cash + holdingsValue;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Trade</h1>
      <p className="mt-2 text-muted">Buy and sell at live prices on a simulated account.</p>

      <p className="mt-6 text-2xl font-semibold tabular-nums">${totalValue.toFixed(2)}</p>
      <p className="mt-1 text-sm text-muted">
        Cash <span className="tabular-nums text-foreground">${cash.toFixed(2)}</span>
      </p>

      <PriceChart candles={candles} days={days} onChangeDays={setDays} />
      <p className="mt-3 text-xs text-muted">
        Charts by{" "}
        <a
          href="https://www.tradingview.com"
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground"
        >
          TradingView
        </a>
      </p>

      <div className="mt-6 flex items-center gap-2 text-sm">
        <label className="text-muted">Buy amount $</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-28 rounded border border-border bg-surface px-3 py-1 tabular-nums"
        />
      </div>

      <CoinSearchList coins={coins} selectedId={shownId} onSelect={setSelectedId} onBuy={buy} />

      <div className="mt-10 flex items-center gap-2 text-sm">
        <label className="text-muted">Sell amount $</label>
        <input
          type="number"
          value={sellAmount}
          onChange={(e) => setSellAmount(e.target.value)}
          className="w-28 rounded border border-border bg-surface px-3 py-1 tabular-nums"
        />
      </div>

      <Holdings holdings={holdings} coins={coins} onSell={sell} />
    </main>
  );
}
