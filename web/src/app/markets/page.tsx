import { getTopCoins } from "@/lib/coingecko";
import MarketsTable from "@/components/markets-table";

export default async function MarketsPage() {
  const coins = await getTopCoins();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Markets</h1>
      <div className="mt-1 flex items-center gap-2 text-sm text-muted">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-down animate-pulse" />
        Live prices for the top crypto assets by market capitalization.
      </div>

      <MarketsTable initialCoins={coins} />
    </main>
  );
}
