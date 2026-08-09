"use client";

import { useEffect, useRef } from "react";
import { createChart, LineSeries, type UTCTimestamp } from "lightweight-charts";

// what the account was worth each day, next to buying and holding
export default function EquityChart({
  times,
  values,
  holdValues,
}: {
  times: number[];
  values: number[];
  holdValues: number[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: "#c1bbba",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "#333131" },
        horzLines: { color: "#333131" },
      },
    });
    const strategyLine = chart.addSeries(LineSeries, { color: "#56d97e", lineWidth: 2 });
    const holdLine = chart.addSeries(LineSeries, { color: "#8a8382", lineWidth: 1 });

    // value for day i is worked out at the next day's price, so use that day
    const strategyData = [];
    const holdData = [];
    for (let i = 0; i < values.length; i++) {
      const time = times[i + 1] as UTCTimestamp;
      strategyData.push({ time: time, value: values[i] });
      holdData.push({ time: time, value: holdValues[i] });
    }
    strategyLine.setData(strategyData);
    holdLine.setData(holdData);
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [times, values, holdValues]);

  return <div ref={containerRef} className="h-75 w-full" />;
}
