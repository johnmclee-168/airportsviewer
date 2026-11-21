/**
 * GET /api/airports
 * Same-origin proxy for the Qantas airports API (the upstream sends no CORS
 * headers). Returns normalised airports as `{ airports: Airport[] }`, or a
 * 502 `{ error }` payload when the upstream fails.
 */
import { connection } from "next/server";
import { getAirports, UpstreamError } from "@/lib/airports/source";

export async function GET() {
  // Always resolve at request time; never prerender upstream data at build.
  await connection();
  try {
    const airports = await getAirports();
    return Response.json(
      { airports },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } },
    );
  } catch (error) {
    const message =
      error instanceof UpstreamError ? error.message : "Unexpected error loading airports";
    console.error("[api/airports]", error);
    return Response.json({ error: message }, { status: 502 });
  }
}
