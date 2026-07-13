import { type Candle } from "@/lib/coingecko";
import CandlestickChart from "@/components/candlestick-chart";

const ranges = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
];

// the candlestick chart and buttons to switch the time range
export default function PriceChart({
  candles,
  days,
  onChangeDays,
}: {
  candles: Candle[];
  days: number;
  onChangeDays: (days: number) => void;
}) {
  if (candles.length === 0) {
    return null;
  }
  return (
    <div className="mt-8">
      <div className="mb-3 flex gap-2">
        {ranges.map((range) => {
          let buttonClass = "rounded px-3 py-1 text-sm text-muted hover:text-foreground";
          if (range.days === days) {
            buttonClass = "rounded px-3 py-1 text-sm bg-surface text-foreground";
          }
          return (
            <button
              key={range.days}
              onClick={() => onChangeDays(range.days)}
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
