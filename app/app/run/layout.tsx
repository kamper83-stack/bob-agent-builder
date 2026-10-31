/**
 * run/layout.tsx
 *
 * Operator-phase layout — replaces the builder NavBar for all /run/* routes.
 * The /run/[id] page is the "use this agent" view used by operators, not builders.
 * It shows a minimal header with just the app wordmark and a link back to My Agents.
 */
import React from "react";
import Link from "next/link";

export default function RunLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      {/* Minimal operator header — no build/test/improve steps */}
      <header className="sticky top-0 z-10 border-b border-border-subtle bg-surface">
        <div className="mx-auto flex max-w-screen-xl items-center gap-4 px-6 py-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors shrink-0"
          >
            ← My Agents
          </Link>
          <span className="text-border-subtle">|</span>
          <span className="font-display text-base font-semibold text-text-primary tracking-tight">
            Agent Studio
          </span>
          <span className="ml-auto text-xs font-medium text-text-tertiary bg-border-subtle px-2 py-0.5 rounded-full">
            Run mode
          </span>
        </div>
      </header>
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}
