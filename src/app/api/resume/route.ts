import { NextRequest, NextResponse } from "next/server";
import { validateResumeFile } from "@/resume/validate";
import { parsePdf } from "@/resume/parsePdf";
import { extractResume } from "@/ai/extractResume";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    const check = validateResumeFile({ type: file.type, size: file.size });
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await parsePdf(buffer);
    const resume = await extractResume(text);
    return NextResponse.json({ data: resume });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
