import { NextRequest, NextResponse } from "next/server";
import { searchArbetnow } from "@/services/jobs/arbetnow";
import { normalizeJobs } from "@/services/jobs/normalize";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = typeof body.query === "string" ? body.query : "";
    const remote = body.remote === true;
    const raw = await searchArbetnow(query, { remote });
    return NextResponse.json({ data: normalizeJobs(raw) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
