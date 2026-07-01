import { getTopCoins } from "@/lib/coingecko";
import Sparkline from "@/components/sparkline";

function formatPrice(value: number) {
  let maxDigits = 2;
  if (value < 1) {
    maxDigits = 6;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDigits,
  }).format(value);
}

function formatCompact(value: number) {
  const billion = 1000000000;
  const million = 1000000;
  if (value >= billion) {
    return (value / billion).toFixed(2) + "B";
  }
  if (value >= million) {
    return (value / million).toFixed(2) + "M";
  }
  return value.toString();
}

function ChangeCell({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-muted">—</span>;
  }
  let colorClass: string;
  let arrow: string;
  if (value >= 0) {
    colorClass = "bg-up/10 text-up";
    arrow = "▲";
  } else {
    colorClass = "bg-down/10 text-down";
    arrow = "▼";
  }

  return (
    <span className={`inline-block rounded px-1.5 py-0.5 font-medium ${colorClass}`}>
      {arrow} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

export default async function MarketsPage() {
  const coins = await getTopCoins();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Markets</h1>
      <div className="mt-1 flex items-center gap-2 text-sm text-muted">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-down animate-pulse" />
        Live prices for the top crypto assets by market capitalization.
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-3 pr-4 font-medium">Rank</th>
              <th className="py-3 pr-4 font-medium">Asset</th>
              <th className="py-3 pr-4 text-right font-medium">Price</th>
              <th className="py-3 pr-4 text-right font-medium">24h</th>
              <th className="hidden py-3 pr-4 font-medium md:table-cell">7D</th>
              <th className="hidden py-3 pr-4 text-right font-medium sm:table-cell">
                Market Cap
              </th>
              <th className="hidden py-3 text-right font-medium sm:table-cell">
                Volume (24h)
              </th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin) => (
              <tr key={coin.id} className="transition-colors hover:bg-surface">
                <td className="py-3 pr-4 text-muted">{coin.market_cap_rank}</td>
                <td className="py-3 pr-4 font-medium">
                  {coin.name} ({coin.symbol.toUpperCase()})
                </td>
                <td className="py-3 pr-4 text-right tabular-nums">
                  {formatPrice(coin.current_price)}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums">
                  <ChangeCell value={coin.price_change_percentage_24h} />
                </td>
                <td className="hidden py-3 pr-4 md:table-cell">
                  <Sparkline data={coin.sparkline_in_7d?.price ?? []} />
                </td>
                <td className="hidden py-3 pr-4 text-right tabular-nums text-muted sm:table-cell">
                  ${formatCompact(coin.market_cap)}
                </td>
                <td className="hidden py-3 text-right tabular-nums text-muted sm:table-cell">
                  ${formatCompact(coin.total_volume)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
