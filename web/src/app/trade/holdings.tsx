import { type MarketCoin, type Holding } from "./page";

// shows everything we own, with its current value and profit/loss
export default function Holdings({
  holdings,
  coins,
  onSell,
}: {
  holdings: Holding[];
  coins: MarketCoin[];
  onSell: (holding: Holding) => void;
}) {
  return (
    <>
      <h2 className="mt-6 text-sm font-medium uppercase tracking-wide text-muted">Holdings</h2>
      <div className="mt-3 space-y-2">
        {holdings.length === 0 && <p className="text-sm text-muted">Nothing yet.</p>}
        {holdings.map((holding) => {
          const coin = coins.find((c) => c.id === holding.id);
          let value = 0;
          if (coin) {
            value = holding.quantity * coin.price;
          }
          // profit/loss since we bought it, rounded to cents so small rounding doesn't show as loss
          const gain = Number((value - holding.cost).toFixed(2));
          let gainClass = "text-up";
          let gainText = "+$" + gain.toFixed(2);
          if (gain < 0) {
            gainClass = "text-down";
            gainText = "-$" + Math.abs(gain).toFixed(2);
          }
          return (
            <div
              key={holding.id}
              className="flex items-center justify-between rounded border border-border px-4 py-3 text-sm"
            >
              <span>{holding.name}</span>
              <div className="flex items-center gap-4">
                <span className="tabular-nums text-muted">{holding.quantity.toFixed(6)}</span>
                <span className="tabular-nums">${value.toFixed(2)}</span>
                <span className={`tabular-nums ${gainClass}`}>{gainText}</span>
                <button onClick={() => onSell(holding)} className="text-muted hover:text-down">
                  Sell
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
