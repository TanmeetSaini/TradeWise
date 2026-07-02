"use client";

import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, type UTCTimestamp } from "lightweight-charts";
import { type Candle } from "@/lib/coingecko";

export default function CandlestickChart({ candles }: { candles: Candle[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: "#90887a",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "#2c261d" },
        horzLines: { color: "#2c261d" },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#56d97e",
      downColor: "#fb6f7d",
      wickUpColor: "#56d97e",
      wickDownColor: "#fb6f7d",
      borderVisible: false,
    });

    const data = candles.map((candle) => ({
      time: candle.time as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));
    series.setData(data);
    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [candles]);

  return <div ref={containerRef} className="h-[400px] w-full" />;
}
