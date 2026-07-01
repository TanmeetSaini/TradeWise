import Link from "next/link";

const features = [
  {
    title: "Build",
    body: "Create a strategy from simple rules, like buying when RSI drops below 30 and the price is above its 50-day average.",
  },
  {
    title: "Test",
    body: "Run the strategy against years of real market data to see how it would have performed, including fees and slippage.",
  },
  {
    title: "Optimize",
    body: "Try many combinations of a strategy's settings to find the ones that perform best on past data.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6">
      <section className="pt-12 pb-14 sm:pt-16">
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Build and test crypto trading strategies.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted">
          TradeWise is a project for building and testing crypto trading
          strategies. You can build a strategy from simple rules and test it
          against real market data to see how it would have performed, or trade
          manually at live prices yourself. Everything runs on a simulated
          portfolio, so no real money is involved.
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
