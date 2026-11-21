/**
 * GET /api/airports
 * Same-origin proxy for the Qantas airports API (the upstream sends no CORS
 * headers). Returns normalised airports as `{ airports: Airport[] }`, or a
 * 502 `{ error }` payload when the upstream fails. Both responses carry an
 * `X-Airports-Source` header (e.g. "live https://api.qantas.com/...") so the
 * browser console can show where the data came from.
 */
import { connection } from "next/server";
import { SOURCE_HEADER } from "@/lib/airports/client";
import { describeSource, getAirports, UpstreamError } from "@/lib/airports/source";

export async function GET() {
  // Always resolve at request time; never prerender upstream data at build.
  await connection();
  const source = describeSource();
  try {
    const airports = await getAirports();
    return Response.json(
      { airports },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
          [SOURCE_HEADER]: source,
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof UpstreamError ? error.message : "Unexpected error loading airports";
    console.error("[api/airports]", error);
    return Response.json({ error: message }, { status: 502, headers: { [SOURCE_HEADER]: source } });
  }
}
