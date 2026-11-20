/**
 * RootLayout
 * App-wide HTML shell: loads fonts and global styles, sets viewport/metadata,
 * and renders the sticky AppHeader above a centred, mobile-first content column.
 * AirportsProvider wraps the pages so airport data is fetched once and shared;
 * RefreshIndicator shows background refreshes, ConnectivityBanner flags
 * offline/stale data and ServiceWorkerRegistrar enables
 * the offline app shell in production.
 */
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppHeader } from "@/components/AppHeader";
import { ConnectivityBanner } from "@/components/ConnectivityBanner";
import { RefreshIndicator } from "@/components/RefreshIndicator";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { AirportsProvider } from "@/context/AirportsProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Airports Viewer",
  description: "Browse the airports Qantas operates from.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e40000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
          <AirportsProvider>
            <RefreshIndicator />
            <ConnectivityBanner />
            {children}
          </AirportsProvider>
        </main>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
