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

// send json, plus api key if we have one in .env.local
const headers: Record<string, string> = { accept: "application/json" };
const apiKey = process.env.COINGECKO_API_KEY;
if (apiKey) {
  headers["x-cg-demo-api-key"] = apiKey;
}

// top coins by market cap, defaults to 50 with sparklines for the markets table
export async function getTopCoins(perPage = 50, sparkline = true): Promise<Coin[]> {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&price_change_percentage=24h&sparkline=${sparkline}`;
  const response = await fetch(url, { headers, next: { revalidate: 60 } });
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

// candles for one coin over x days
export async function getCoinOHLC(id: string, days: number): Promise<Candle[]> {
  const url = `https://api.coingecko.com/api/v3/coins/${id}/ohlc?vs_currency=usd&days=${days}`;
  const response = await fetch(url, { headers, next: { revalidate: 60 } });
  if (!response.ok) {
    throw new Error(`CoinGecko OHLC request failed: ${response.status}`);
  }
  // coingecko gives rows of [time, open, high, low, close], turn each into a candle
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

// daily closing prices for the backtest
export async function getDailyPrices(id: string, days: number): Promise<number[]> {
  const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
  const response = await fetch(url, { headers, next: { revalidate: 60 } });
  if (!response.ok) {
    throw new Error(`CoinGecko market chart request failed: ${response.status}`);
  }
  const data = await response.json();
  const rows: number[][] = data.prices;
  const prices: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    prices.push(rows[i][1]);
  }
  return prices;
}
