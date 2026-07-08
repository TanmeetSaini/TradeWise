// fields we use from coingecko
export type Coin = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  sparkline_in_7d: { price: number[] };
};

export const MARKETS_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&price_change_percentage=24h&sparkline=true";

// send json, plus our api key if we have one in .env.local
const headers: Record<string, string> = { accept: "application/json" };
const apiKey = process.env.COINGECKO_API_KEY;
if (apiKey) {
  headers["x-cg-demo-api-key"] = apiKey;
}

// get the top 50 coins for the markets table
export async function getTopCoins(): Promise<Coin[]> {
  const response = await fetch(MARKETS_URL, { headers, next: { revalidate: 60 } });
  if (!response.ok) {
    throw new Error(`CoinGecko request failed: ${response.status}`);
  }
  return response.json();
}

// one candle for the chart
export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

// get the candlestick data for one coin over the given number of days
export async function getCoinOHLC(id: string, days: number): Promise<Candle[]> {
  const url = `https://api.coingecko.com/api/v3/coins/${id}/ohlc?vs_currency=usd&days=${days}`;
  const response = await fetch(url, { headers, next: { revalidate: 60 } });
  if (!response.ok) {
    throw new Error(`CoinGecko OHLC request failed: ${response.status}`);
  }
  // coingecko returns nameless rows of [time, open, high, low, close], so turn each into a labeled candle
  const rows: number[][] = await response.json();
  const candles: Candle[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    candles.push({
      time: row[0] / 1000, // lightweight-charts wants seconds
      open: row[1],
      high: row[2],
      low: row[3],
      close: row[4],
    });
  }
  return candles;
}
