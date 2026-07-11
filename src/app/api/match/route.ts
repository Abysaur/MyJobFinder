import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { matchJobs } from "@/ai/matchJobs";
import { resumeSchema, jobsSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let resume, jobs;
    try {
      resume = resumeSchema.parse(body.resume);
      jobs = jobsSchema.parse(body.jobs ?? []);
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
      }
      throw err;
    }
    const matches = await matchJobs(resume, jobs);
    return NextResponse.json({ data: matches });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
