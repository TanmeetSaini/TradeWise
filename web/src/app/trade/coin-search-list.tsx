import { useState } from "react";
import { type MarketCoin } from "./page";

// the search box plus the list of coins you can buy
export default function CoinSearchList({
  coins,
  selectedId,
  onSelect,
  onBuy,
}: {
  coins: MarketCoin[];
  selectedId: string;
  onSelect: (id: string) => void;
  onBuy: (coin: MarketCoin) => void;
}) {
  const [search, setSearch] = useState("");

  // figure out which coins to show in the list
  let shown: MarketCoin[] = [];
  if (search === "") {
    // nothing typed yet, so just show the first 5 coins
    for (let i = 0; i < coins.length && i < 5; i++) {
      shown.push(coins[i]);
    }
  } else {
    // show every coin whose name contains what the user typed
    const searchText = search.toLowerCase();
    for (let i = 0; i < coins.length; i++) {
      const name = coins[i].name.toLowerCase();
      if (name.includes(searchText)) {
        shown.push(coins[i]);
      }
    }
  }

  return (
    <>
      <div className="mt-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search coins…"
          className="w-full rounded border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-4 space-y-2">
        {coins.length === 0 && <p className="text-sm text-muted">Loading prices…</p>}
        {shown.map((coin) => {
          let rowClass = "flex items-center justify-between rounded border border-border px-4 py-3 text-sm";
          if (coin.id === selectedId) {
            rowClass = "flex items-center justify-between rounded border border-muted px-4 py-3 text-sm";
          }
          return (
            <div key={coin.id} className={rowClass}>
              <button onClick={() => onSelect(coin.id)} className="text-left hover:text-foreground">
                {coin.name}{" "}
                <span className="text-muted tabular-nums">${coin.price.toLocaleString()}</span>
              </button>
              <button
                onClick={() => onBuy(coin)}
                className="rounded bg-surface px-3 py-1 font-medium hover:text-foreground"
              >
                Buy
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
