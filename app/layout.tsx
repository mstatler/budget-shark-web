import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// CRITICAL FIX: Import AuthSync. It must be a default import 
// (no curly braces around AuthSync).
import AuthSync from "@/components/auth/AuthSync"; 

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Budget Shark",
  description: "Budget Shark App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* CRITICAL FIX: AuthSync is mounted here */}
        <AuthSync /> 
        {children}
      </body>
    </html>
  );
}
