import type { Metadata } from "next";
import { Geist } from "next/font/google";
import NavBar from "./components/NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Studio",
  description: "Build self-improving AI agents grounded in company knowledge",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 font-sans">
        <NavBar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
