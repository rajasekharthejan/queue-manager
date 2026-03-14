import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ISO Queue Manager - Interconnection Project Management",
  description: "Manage generation interconnection queue projects across MISO, PJM, SPP, CAISO, and other ISOs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} font-sans h-full bg-slate-50 antialiased`}>
        <div className="min-h-full">
          <nav className="bg-slate-900 shadow-lg">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-8">
                  <Link href="/" className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 font-bold text-slate-900 text-sm">
                      QM
                    </div>
                    <span className="text-lg font-semibold text-white tracking-tight">
                      ISO Queue Manager
                    </span>
                  </Link>
                  <div className="hidden md:flex items-center gap-1">
                    <Link
                      href="/"
                      className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/projects/new"
                      className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      New Project
                    </Link>
                    <Link
                      href="/requests"
                      className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      Requests
                    </Link>
                    <Link
                      href="/analytics"
                      className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      Analytics
                    </Link>
                    <Link
                      href="/operating-assets"
                      className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      Operating Assets
                    </Link>
                    <Link
                      href="/projects/security"
                      className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      Security Forecast
                    </Link>
                    <Link
                      href="/security-calc"
                      className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      Security Calc
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
