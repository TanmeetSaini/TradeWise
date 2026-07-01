import Link from "next/link";

const links = [
  { href: "/markets", label: "Markets" },
  { href: "/trade", label: "Trade" },
  { href: "/backtest", label: "Backtest" },
];

export default function Navbar() {
  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Trade<span className="text-down">Wise</span>
          </Link>
          <ul className="flex items-center gap-6 text-sm text-muted">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <Link
          href="/portfolio"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          Portfolio
        </Link>
      </nav>
    </header>
  );
}
