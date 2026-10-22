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

  return (
    <div className="mx-auto flex max-w-screen-xl items-center justify-between px-6 py-3">
      <Link href="/" className="text-base font-semibold text-gray-900 dark:text-gray-100 tracking-tight shrink-0">
        Agent Studio
      </Link>
      <nav className="flex items-center gap-1" aria-label="Main navigation">
        <Link href="/"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${isAgents ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"}`}>
          Agents
        </Link>
        <Link href="/build"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${isBuild ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"}`}>
          Build
        </Link>
        {isRun && (
          <span className="rounded-full px-4 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">Run</span>
        )}
        {isImprove && (
          <span className="rounded-full px-4 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">Improve</span>
        )}
      </nav>
    </div>
  );
}

export default function NavBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <Suspense fallback={
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-6 py-3">
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Agent Studio</span>
        </div>
      }>
        <NavBarInner />
      </Suspense>
    </header>
  );
}
