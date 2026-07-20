"use client";

import { useState } from "react";
import { login, signup } from "./actions";

export default function LoginPage() {
  const [showName, setShowName] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <form className="space-y-4">
        {showName && (
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm text-muted">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm text-muted">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm text-muted">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            formAction={login}
            className="flex-1 rounded border border-border bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Log in
          </button>
          {showName ? (
            <button
              key="signup-submit"
              formAction={signup}
              className="flex-1 rounded border border-border bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Sign up
            </button>
          ) : (
            <button
              key="signup-reveal"
              type="button"
              onClick={() => setShowName(true)}
              className="flex-1 rounded border border-border bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Sign up
            </button>
          )}
        </div>

        {showName && (
          <button
            type="button"
            onClick={() => setShowName(false)}
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Back to log in
          </button>
        )}
      </form>
    </main>
  );
}
