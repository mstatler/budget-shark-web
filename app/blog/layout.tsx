import Link from "next/link";
import type { ReactNode } from "react";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <nav className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-semibold text-gray-900">
            Budget Shark
          </Link>
          <div className="space-x-6 text-sm">
            <Link href="/blog" className="text-gray-700 hover:text-gray-900">
              Blog
            </Link>
            <Link
              href="/auth/sign-in"
              className="text-gray-700 hover:text-gray-900"
            >
              Sign In
            </Link>
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 bg-gray-50">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white text-center py-6 text-sm text-gray-500">
        © {new Date().getFullYear()} Budget Shark • All Rights Reserved
      </footer>
    </div>
  );
}
