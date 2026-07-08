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

export default function PriceHistory({ id, initialCandles }: { id: string; initialCandles: Candle[] }) {
  const [days, setDays] = useState(30);
  const [candles, setCandles] = useState(initialCandles);

  async function changeRange(newDays: number) {
    setDays(newDays);
    try {
      const data = await getCoinOHLC(id, newDays);
      setCandles(data);
    } catch {
      setCandles([]);
    }
  }
  let chart;
  if (candles.length > 0) {
    chart = <CandlestickChart candles={candles} />;
  } else {
    chart = (
      <div className="flex h-[300px] items-center justify-center rounded border border-border text-sm text-muted">
        Chart unavailable right now — try again in a moment.
      </div>
    );
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
      {chart}
    </div>
  );
}
