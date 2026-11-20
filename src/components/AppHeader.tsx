/**
 * AppHeader
 * Sticky brand bar shown on every page. The title links back to the airport
 * list so users always have a way home, on both mobile and desktop.
 */
import Link from "next/link";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 bg-brand text-white shadow-md">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-current">
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
          </svg>
          <span className="text-lg">Airports Viewer</span>
        </Link>
      </div>
    </header>
  );
}
