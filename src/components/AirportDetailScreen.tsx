"use client";
/**
 * AirportDetailScreen
 * Container for the /airports/[code] page. Resolves the airport from the URL
 * code using the shared AirportsProvider data, and handles the loading, error
 * and not-found cases. "Back" uses browser history when the user came from the
 * list (preserving scroll and search), otherwise it navigates to "/".
 */
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAirports } from "@/context/AirportsProvider";
import { AirportDetail } from "./AirportDetail";
import { ErrorState } from "./ErrorState";
import { LoadingScreen } from "./LoadingScreen";

export function AirportDetailScreen() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code ?? "").toUpperCase();
  const router = useRouter();
  const { status, airports, error, reload, selectedCode, selectAirport } = useAirports();
  const cameFromList = useRef(selectedCode === code);
  const airport = useMemo(() => airports.find((a) => a.code === code), [airports, code]);

  // Keep the list highlight in sync, including for deep links.
  useEffect(() => {
    if (selectedCode !== code) selectAirport(code);
    // Only when the code in the URL changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const goBack = useCallback(() => {
    if (cameFromList.current) router.back();
    else router.push("/");
  }, [router]);

  if (status === "loading") {
    return <LoadingScreen label="Loading airport…" skeletonRows={0} />;
  }

  if (status === "error" && error) {
    return (
      <ErrorState error={error} onRetry={reload}>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="h-11 rounded-xl border border-border px-6 font-medium hover:bg-background"
        >
          All airports
        </button>
      </ErrorState>
    );
  }

  if (!airport) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-12 text-center animate-fade-in-up">
        <h1 className="text-xl font-semibold">Airport not found</h1>
        <p className="text-muted">We couldn’t find an airport with the code “{code}”.</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-2 rounded-xl bg-foreground px-5 py-3 font-medium text-background"
        >
          Back to airports
        </button>
      </div>
    );
  }

  return <AirportDetail airport={airport} onBack={goBack} />;
}
