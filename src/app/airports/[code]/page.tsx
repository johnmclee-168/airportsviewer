/**
 * Airport detail page (/airports/[code])
 * Full-page detail view for one airport, rendered by AirportDetailScreen from
 * the shared client-side airport data. The Suspense boundary lets Next.js
 * prerender a static shell while the URL params resolve on the client.
 */
import { Suspense } from "react";
import { AirportDetailScreen } from "@/components/AirportDetailScreen";

export default function AirportPage() {
  return (
    <Suspense
      fallback={
        <p role="status" className="py-10 text-center text-muted">
          Loading airport…
        </p>
      }
    >
      <AirportDetailScreen />
    </Suspense>
  );
}
