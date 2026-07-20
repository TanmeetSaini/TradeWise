import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const links = [
  { href: "/markets", label: "Markets" },
  { href: "/trade", label: "Trade" },
  { href: "/backtest", label: "Backtest" },
];

export default async function Navbar() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const email = claimsData?.claims?.email;
  const name = claimsData?.claims?.user_metadata?.name;

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
        <div className="flex items-center gap-6 text-sm text-muted">
          <Link
            href="/portfolio"
            className="transition-colors hover:text-foreground"
          >
            Portfolio
          </Link>
          {email ? (
            <div className="flex items-center gap-3">
              <span>{name || email}</span>
              <form action="/auth/signout" method="post">
                <button className="transition-colors hover:text-foreground">
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
