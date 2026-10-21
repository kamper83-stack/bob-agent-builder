import type { Metadata } from "next";
import { Geist } from "next/font/google";
import React from "react";
import NavBar from "./components/NavBar";
import { AgentProvider } from "./context/AgentContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Studio",
  description: "Build self-improving AI agents grounded in company knowledge",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 font-sans">
        <AgentProvider>
          <NavBar />
          <main className="flex-1">{children}</main>
        </AgentProvider>
      </body>
    </html>
  );
}
