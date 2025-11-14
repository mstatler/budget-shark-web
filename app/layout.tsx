// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Budget Shark",
  description: "Cleaner budgeting & forecasting.",
  openGraph: {
    title: "Budget Shark",
    description: "Cleaner budgeting & forecasting for finance teams.",
    images: ["/og-image.png"],
    url: "https://thebudgetshark.com",
    type: "website",
  },
  metadataBase: new URL("https://thebudgetshark.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={
          inter.className + " bg-white text-slate-900 flex flex-col min-h-screen"
        }
      >
        <main className="flex-1">{children}</main>

        {/* 🦈 Footer */}
        <footer className="mt-16 mb-6 text-xs text-slate-400 text-center">
          © {new Date().getFullYear()} Budget Shark •{" "}
          <a
            href="mailto:support@thebudgetshark.com"
            className="underline hover:text-slate-500"
          >
            support@thebudgetshark.com
          </a>{" "}
          •{" "}
          <a href="/privacy" className="underline hover:text-slate-500">
            Privacy
          </a>{" "}
          |{" "}
          <a href="/terms" className="underline hover:text-slate-500">
            Terms
          </a>
        </footer>

        <Analytics />
      </body>
    </html>
  );
}
