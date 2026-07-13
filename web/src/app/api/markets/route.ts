import { getTopCoins } from "@/lib/coingecko";

// our own endpoint so the browser can get prices without ever seeing the api key
export async function GET() {
  const coins = await getTopCoins(250, false);
  return Response.json(coins);
}
