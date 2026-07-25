import { getDailyPrices } from "@/lib/coingecko";

// daily closing prices for one coin
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "";
  const days = Number(searchParams.get("days") || "30");
  const prices = await getDailyPrices(id, days);
  return Response.json(prices);
}
