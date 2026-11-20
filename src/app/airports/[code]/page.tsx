/**
 * Airport detail page (/airports/[code])
 * Full-page detail view for one airport, rendered by AirportDetailScreen from
 * the shared client-side airport data. The Suspense boundary lets Next.js
 * prerender a static shell while the URL params resolve on the client.
 */
import { Suspense } from "react";
import { AirportDetailScreen } from "@/components/AirportDetailScreen";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function AirportPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Loading airport…" skeletonRows={0} />}>
      <AirportDetailScreen />
    </Suspense>
  );
}
