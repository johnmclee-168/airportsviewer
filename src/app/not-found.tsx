/**
 * 404 page
 * Shown for unknown URLs, with a link back to the airport list.
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-12 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-muted">The page you’re looking for doesn’t exist.</p>
      <Link href="/" className="mt-2 rounded-xl bg-foreground px-5 py-3 font-medium text-background">
        Back to airports
      </Link>
    </div>
  );
}
