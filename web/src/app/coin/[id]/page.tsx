import Link from "next/link";
import { getCoinOHLC } from "@/lib/coingecko";
import CoinChart from "@/components/coin-chart";

export default async function CoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candles = await getCoinOHLC(id, 30);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-12">
      <Link href="/markets" className="text-sm text-muted hover:text-foreground">
        &larr; Back to markets
      </Link>
      <h1 className="mt-4 text-2xl font-semibold capitalize tracking-tight">{id}</h1>
      <div className="mt-8">
        <CoinChart id={id} initialCandles={candles} />
      </div>
      <p className="mt-3 text-xs text-muted">
        Charts by{" "}
        <a
          href="https://www.tradingview.com"
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground"
        >
          TradingView
        </a>
      </p>
    </main>
  );
}
