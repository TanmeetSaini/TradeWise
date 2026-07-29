import Link from "next/link";

const features = [
  {
    title: "Build",
    body: "Create a strategy from simple rules, like buying when RSI drops below 30 and the price is above its 50-day average.",
  },
  {
    title: "Test",
    body: "Run the strategy against up to a year of real daily prices to see how it would have performed, including trading fees and slippage.",
  },
  {
    title: "Trade",
    body: "Buy and sell at live prices on a simulated $10,000 account, and track what you own from the portfolio page.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6">
      <section className="pt-12 pb-14 sm:pt-16">
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Most trading strategies lose to just holding.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted">
          This is a way to find out if yours is one of them.
        </p>
        <div className="mt-8">
          <Link
            href="/markets"
            className="inline-block rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Explore markets
          </Link>
        </div>
      </section>

      <section className="pb-24">
        <div className="grid gap-8 sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="border-t border-border pt-6">
              <h2 className="text-lg font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
