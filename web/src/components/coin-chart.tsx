"use client";

import { useState } from "react";
import { getCoinOHLC, type Candle } from "@/lib/coingecko";
import CandlestickChart from "@/components/candlestick-chart";

const ranges = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
];

export default function CoinChart({ id, initialCandles }: { id: string; initialCandles: Candle[] }) {
  const [days, setDays] = useState(30);
  const [candles, setCandles] = useState(initialCandles);

  async function changeRange(newDays: number) {
    setDays(newDays);
    const data = await getCoinOHLC(id, newDays);
    setCandles(data);
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {ranges.map((range) => {
          let buttonClass = "rounded px-3 py-1 text-sm text-muted hover:text-foreground";
          if (range.days === days) {
            buttonClass = "rounded px-3 py-1 text-sm bg-surface text-foreground";
          }
          return (
            <button
              key={range.days}
              onClick={() => changeRange(range.days)}
              className={buttonClass}
            >
              {range.label}
            </button>
          );
        })}
      </div>
      <CandlestickChart candles={candles} />
    </div>
  );
}
