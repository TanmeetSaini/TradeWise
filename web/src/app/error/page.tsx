import Link from "next/link";

export default function ErrorPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 text-muted">
        Sorry, we could not sign you in. Please try again.
      </p>
      <Link
        href="/login"
        className="mt-6 text-sm text-muted transition-colors hover:text-foreground"
      >
        Back to sign in
      </Link>
    </main>
  );
}
