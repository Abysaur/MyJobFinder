import { NextRequest, NextResponse } from "next/server";
import { matchJobs } from "@/ai/matchJobs";
import { resumeSchema } from "@/lib/schemas";
import type { Job } from "@/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const resume = resumeSchema.parse(body.resume);
    const jobs = Array.isArray(body.jobs) ? (body.jobs as Job[]) : [];
    const matches = await matchJobs(resume, jobs);
    return NextResponse.json({ data: matches });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
