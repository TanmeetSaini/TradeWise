// the fields we use from the coingecko response
export type Coin = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  // 7 day prices for the sparkline (can be missing)
  sparkline_in_7d?: { price: number[] };
};

export const MARKETS_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&price_change_percentage=24h&sparkline=true";

export async function getTopCoins(): Promise<Coin[]> {
  const res = await fetch(MARKETS_URL, {
    headers: { accept: "application/json" },
    // cache for 60s so we don't hit CoinGecko on every request
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`CoinGecko request failed: ${res.status}`);
  }

  return res.json();
}

// one candle for the candlestick chart
export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export async function getCoinOHLC(id: string, days: number): Promise<Candle[]> {
  const url = `https://api.coingecko.com/api/v3/coins/${id}/ohlc?vs_currency=usd&days=${days}`;
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`CoinGecko OHLC request failed: ${res.status}`);
  }

  // coingecko returns rows of [timestamp, open, high, low, close]
  const rows: number[][] = await res.json();
  const candles: Candle[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    candles.push({
      time: row[0] / 1000, // coingecko gives milliseconds, the chart wants seconds
      open: row[1],
      high: row[2],
      low: row[3],
      close: row[4],
    });
  }

  return candles;
}
