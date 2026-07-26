import { getCoinOHLC } from "@/lib/coingecko";

// candlestick data for one coin
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "";
  const days = Number(searchParams.get("days") || "30");
  const candles = await getCoinOHLC(id, days);
  return Response.json(candles);
}
