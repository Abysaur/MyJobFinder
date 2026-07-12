import { NextRequest, NextResponse } from "next/server";
import { searchJobs } from "@/services/jobs/aggregate";
import { normalizeQuery } from "@/services/jobs/provider";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = normalizeQuery(body);
    const jobs = await searchJobs(query);
    return NextResponse.json({ data: jobs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
