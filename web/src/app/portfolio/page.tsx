"use client";
import { useState, useEffect } from "react";
import { getHoldings, getAccount } from "../trade/actions";

// a coin we own
type Holding = {
  id: string;
  name: string;
  quantity: number;
  cost: number;
};

// a coin and its current price
type MarketCoin = {
  id: string;
  price: number;
};

export default function PortfolioPage() {
  const [cash, setCash] = useState(0);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [coins, setCoins] = useState<MarketCoin[]>([]);

  // load our cash and coins
  useEffect(() => {
    async function loadAccount() {
      const savedCash = await getAccount();
      setCash(savedCash);
      const savedHoldings = await getHoldings();
      setHoldings(savedHoldings);
    }
    loadAccount();
  }, []);

  // get live prices
  useEffect(() => {
    async function loadCoins() {
      const res = await fetch("/api/markets");
      const data = await res.json();
      const list: MarketCoin[] = [];
      for (let i = 0; i < data.length; i++) {
        list.push({ id: data[i].id, price: data[i].current_price });
      }
      setCoins(list);
    }
    loadCoins();
  }, []);

  // add up what the holdings are worth
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
      <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
      <p className="mt-2 text-muted">Everything you own on your simulated account.</p>

      <p className="mt-6 text-2xl font-semibold tabular-nums">${totalValue.toFixed(2)}</p>
      <p className="mt-1 text-sm text-muted">
        Cash <span className="tabular-nums text-foreground">${cash.toFixed(2)}</span>
      </p>

      <h2 className="mt-10 text-sm font-medium uppercase tracking-wide text-muted">Holdings</h2>
      <div className="mt-3 space-y-2">
        {holdings.length === 0 && <p className="text-sm text-muted">Nothing yet.</p>}
        {holdings.map((holding) => {
          // work out this coin's value
          let value = 0;
          for (let j = 0; j < coins.length; j++) {
            if (coins[j].id === holding.id) {
              value = holding.quantity * coins[j].price;
            }
          }
          // profit or loss since we bought it
          const gain = Number((value - holding.cost).toFixed(2));
          let gainClass = "text-up";
          let gainText = "+$" + gain.toFixed(2);
          if (gain < 0) {
            gainClass = "text-down";
            gainText = "-$" + Math.abs(gain).toFixed(2);
          }
          return (
            <div
              key={holding.id}
              className="flex items-center justify-between rounded border border-border px-4 py-3 text-sm"
            >
              <span>{holding.name}</span>
              <div className="flex items-center gap-4">
                <span className="tabular-nums text-muted">{holding.quantity.toFixed(6)}</span>
                <span className="tabular-nums">${value.toFixed(2)}</span>
                <span className={`tabular-nums ${gainClass}`}>{gainText}</span>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
