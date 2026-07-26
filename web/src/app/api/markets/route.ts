import { getTopCoins } from "@/lib/coingecko";

// our own route so the api key stays on the server
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // markets table wants 50 with sparklines, other pages just want lots of coins
  const perPage = Number(searchParams.get("perPage") || "250");
  const sparkline = searchParams.get("sparkline") === "true";
  const coins = await getTopCoins(perPage, sparkline);
  return Response.json(coins);
}
