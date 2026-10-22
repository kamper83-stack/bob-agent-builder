"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

function NavBarInner() {
  const pathname = usePathname();

  const isAgents  = pathname === "/";
  const isBuild   = pathname.startsWith("/build") || pathname.startsWith("/define");
  const isRun     = pathname.startsWith("/run/");
  const isImprove = pathname.startsWith("/improve");

  const linkBase = "px-1 py-0.5 text-sm font-medium transition-colors";
  const activeLink = `${linkBase} text-text-primary border-b-2 border-structural pb-px`;
  const inactiveLink = `${linkBase} text-text-secondary hover:text-text-primary`;

  return (
    <div className="mx-auto flex max-w-screen-xl items-center justify-between px-6 py-3">
      <Link
        href="/"
        className="font-display text-lg font-semibold text-text-primary tracking-tight shrink-0"
      >
        Agent Studio
      </Link>
      <nav className="flex items-center gap-6" aria-label="Main navigation">
        <Link href="/" className={isAgents ? activeLink : inactiveLink}>
          Agents
        </Link>
        <Link href="/build" className={isBuild ? activeLink : inactiveLink}>
          Build
        </Link>
        {isRun && (
          <span className={activeLink}>Run</span>
        )}
        {isImprove && (
          <span className={activeLink}>Improve</span>
        )}
      </nav>
    </div>
  );
}

export default function NavBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-border-subtle bg-surface">
      <Suspense fallback={
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-6 py-3">
          <span className="font-display text-lg font-semibold text-text-primary">Agent Studio</span>
        </div>
      }>
        <NavBarInner />
      </Suspense>
    </header>
  );
}
