import type { Metadata } from "next";
import { Geist, IBM_Plex_Sans } from "next/font/google";
import React, { Suspense } from "react";
import NavBar from "./components/NavBar";
import { AgentProvider } from "./context/AgentContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Agent Studio",
  description: "Build self-improving AI agents grounded in company knowledge",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${ibmPlexSans.variable} h-full antialiased`}>
      <body className="h-full flex flex-col bg-canvas font-sans text-text-primary">
        <ThemeProvider>
          <AgentProvider>
            <Suspense fallback={<div className="h-14 border-b border-border-subtle bg-surface" />}>
              <NavBar />
            </Suspense>
            <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
          </AgentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
