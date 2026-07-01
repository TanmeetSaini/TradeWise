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

const MARKETS_URL =
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
