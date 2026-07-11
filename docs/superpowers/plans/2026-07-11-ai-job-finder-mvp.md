# AI Job Finder MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an MVP web app where a user uploads a PDF resume and sees real jobs ranked by AI-computed match score.

**Architecture:** Single Next.js (App Router) app, no database, session-only browser state. Server-side Route Handlers own PDF parsing, Anthropic LLM calls, and the Arbetnow job fetch so secrets stay server-side. The client uses React Query to call those routes and ranks results client-side.

**Tech Stack:** Next.js (App Router) + TypeScript, Tailwind CSS, React Query, Anthropic SDK, Zod, `pdf-parse`, Vitest.

## Global Constraints

- TypeScript strict mode; no `any` in committed code.
- Node LLM/network calls only in Route Handlers (`app/api/*`) — never in client components.
- All LLM and external-API JSON validated with Zod before use.
- Upload limit: PDF only, max 5MB; reject empty/corrupt files.
- Anthropic model id: `claude-sonnet-5`.
- Env var for the key: `ANTHROPIC_API_KEY` (read server-side only).
- Save list is in-memory (React state) — no persistence.
- Match score is an integer 0–100.
- Ranking order: match score desc, then postedDate desc.
- Every route handler returns `{ data }` on success or `{ error: string }` with a non-2xx status on failure.
- Unit tests use Vitest; mock all LLM and network calls.

---

### Task 1: Project scaffold & tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `vitest.config.ts`, `.env.example`, `.gitignore`
- Create: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`
- Create: `src/lib/queryClient.tsx` (React Query provider)

**Interfaces:**
- Produces: a running Next.js app with Tailwind, React Query provider mounted, and Vitest runnable via `npm test`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "my-job-finder",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.1",
    "@tanstack/react-query": "^5.59.0",
    "framer-motion": "^11.11.0",
    "mammoth": "^1.8.0",
    "next": "^14.2.15",
    "pdf-parse": "^1.1.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.16.11",
    "@types/pdf-parse": "^1.1.4",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.3",
    "vitest": "^2.1.2"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create config files**

`next.config.mjs`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true };
export default nextConfig;
```

`postcss.config.mjs`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

`tailwind.config.ts`:
```ts
import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "node", globals: true },
  resolve: { alias: { "@": resolve(__dirname, "./src") } },
});
```

`.env.example`:
```
ANTHROPIC_API_KEY=your-key-here
```

`.gitignore`:
```
node_modules
.next
.env
.env.local
coverage
```

- [ ] **Step 4: Create React Query provider `src/lib/queryClient.tsx`**

```tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 5: Create app shell**

`src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`src/app/layout.tsx`:
```tsx
import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "@/lib/queryClient";

export const metadata: Metadata = {
  title: "AI Job Finder",
  description: "Upload your resume, find matching jobs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

`src/app/page.tsx` (placeholder, replaced in Task 15):
```tsx
export default function Home() {
  return <main className="p-8"><h1 className="text-2xl font-bold">AI Job Finder</h1></main>;
}
```

- [ ] **Step 6: Install and verify**

Run: `npm install`
Run: `npm run typecheck`
Expected: no type errors.
Run: `npm test`
Expected: "No test files found" (exit 0) — Vitest runs with nothing to do.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind, React Query, Vitest"
```

---

### Task 2: Core types & Zod schemas

**Files:**
- Create: `src/types/index.ts`
- Create: `src/lib/schemas.ts`
- Test: `src/lib/schemas.test.ts`

**Interfaces:**
- Produces:
  - Types `Resume`, `Job`, `MatchResult` (see fields below).
  - `resumeSchema: ZodType<Resume>`, `matchResultSchema: ZodType<MatchResult>`, `matchResultsSchema` (array).
  - `arbetnowResponseSchema` for the external API payload.

- [ ] **Step 1: Write the failing test `src/lib/schemas.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { resumeSchema, matchResultSchema } from "@/lib/schemas";

describe("resumeSchema", () => {
  it("parses a valid resume", () => {
    const parsed = resumeSchema.parse({
      skills: ["ts"], jobTitles: ["dev"], yearsExperience: 3,
      education: ["BSc"], location: "Berlin",
      contact: { name: "A", email: "a@b.com", phone: "123" },
    });
    expect(parsed.skills).toEqual(["ts"]);
  });

  it("rejects a resume missing skills", () => {
    expect(() => resumeSchema.parse({ jobTitles: [] })).toThrow();
  });
});

describe("matchResultSchema", () => {
  it("rejects a score above 100", () => {
    expect(() =>
      matchResultSchema.parse({ jobId: "1", score: 120, missingSkills: [], reason: "x" }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/schemas.test.ts`
Expected: FAIL — cannot import from `@/lib/schemas`.

- [ ] **Step 3: Create `src/types/index.ts`**

```ts
export type Resume = {
  skills: string[];
  jobTitles: string[];
  yearsExperience: number;
  education: string[];
  location: string | null;
  contact: { name?: string; email?: string; phone?: string };
};

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  salary?: string;
  url: string;
  description: string;
  postedDate: string; // ISO
  tags: string[];
};

export type MatchResult = {
  jobId: string;
  score: number; // 0-100 integer
  missingSkills: string[];
  reason: string;
};
```

- [ ] **Step 4: Create `src/lib/schemas.ts`**

```ts
import { z } from "zod";

export const resumeSchema = z.object({
  skills: z.array(z.string()),
  jobTitles: z.array(z.string()),
  yearsExperience: z.number().min(0),
  education: z.array(z.string()),
  location: z.string().nullable(),
  contact: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }),
});

export const matchResultSchema = z.object({
  jobId: z.string(),
  score: z.number().int().min(0).max(100),
  missingSkills: z.array(z.string()),
  reason: z.string(),
});

export const matchResultsSchema = z.array(matchResultSchema);

export const arbetnowResponseSchema = z.object({
  data: z.array(
    z.object({
      slug: z.string(),
      company_name: z.string(),
      title: z.string(),
      description: z.string(),
      remote: z.boolean(),
      url: z.string(),
      tags: z.array(z.string()),
      job_types: z.array(z.string()),
      location: z.string(),
      created_at: z.number(), // unix seconds
    }),
  ),
});
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/schemas.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/types src/lib/schemas.ts src/lib/schemas.test.ts
git commit -m "feat: add core types and Zod schemas"
```

---

### Task 3: Resume file validation

**Files:**
- Create: `src/resume/validate.ts`
- Test: `src/resume/validate.test.ts`

**Interfaces:**
- Produces: `validateResumeFile(file: { type: string; size: number }) -> { ok: true } | { ok: false; error: string }`
  - Constants `MAX_SIZE_BYTES = 5 * 1024 * 1024`, `ACCEPTED_TYPE = "application/pdf"`.

- [ ] **Step 1: Write the failing test `src/resume/validate.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { validateResumeFile } from "@/resume/validate";

describe("validateResumeFile", () => {
  it("accepts a small PDF", () => {
    expect(validateResumeFile({ type: "application/pdf", size: 1000 })).toEqual({ ok: true });
  });
  it("rejects non-PDF", () => {
    const r = validateResumeFile({ type: "image/png", size: 1000 });
    expect(r).toEqual({ ok: false, error: "Only PDF files are supported." });
  });
  it("rejects files over 5MB", () => {
    const r = validateResumeFile({ type: "application/pdf", size: 6 * 1024 * 1024 });
    expect(r).toEqual({ ok: false, error: "File must be 5MB or smaller." });
  });
  it("rejects empty files", () => {
    const r = validateResumeFile({ type: "application/pdf", size: 0 });
    expect(r).toEqual({ ok: false, error: "File is empty." });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/resume/validate.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/resume/validate.ts`**

```ts
export const MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_TYPE = "application/pdf";

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function validateResumeFile(file: { type: string; size: number }): ValidationResult {
  if (file.type !== ACCEPTED_TYPE) return { ok: false, error: "Only PDF files are supported." };
  if (file.size === 0) return { ok: false, error: "File is empty." };
  if (file.size > MAX_SIZE_BYTES) return { ok: false, error: "File must be 5MB or smaller." };
  return { ok: true };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/resume/validate.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/resume/validate.ts src/resume/validate.test.ts
git commit -m "feat: add resume file validation"
```

---

### Task 4: PDF text extraction wrapper

**Files:**
- Create: `src/resume/parsePdf.ts`

**Interfaces:**
- Consumes: `pdf-parse`.
- Produces: `parsePdf(buffer: Buffer) -> Promise<string>` — throws `Error("Could not read PDF file.")` on parse failure or empty text.

- [ ] **Step 1: Create `src/resume/parsePdf.ts`**

```ts
import pdfParse from "pdf-parse";

export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const result = await pdfParse(buffer);
    const text = result.text.trim();
    if (!text) throw new Error("empty");
    return text;
  } catch {
    throw new Error("Could not read PDF file.");
  }
}
```

Note: `pdf-parse` is thin over `pdf.js` and reads a real PDF buffer; it is exercised end-to-end via the `/api/resume` route (Task 7). No unit test here — it wraps a third-party binary parser and has no branching logic worth mocking.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/resume/parsePdf.ts
git commit -m "feat: add pdf-parse wrapper"
```

---

### Task 5: Anthropic client wrapper

**Files:**
- Create: `src/ai/client.ts`

**Interfaces:**
- Produces:
  - `getAnthropic() -> Anthropic` (throws if `ANTHROPIC_API_KEY` missing).
  - `MODEL = "claude-sonnet-5"`.
  - `completeJson<T>(opts: { system: string; user: string; schema: ZodType<T>; maxTokens?: number }) -> Promise<T>` — calls the model, extracts text, strips markdown code fences, `JSON.parse`, validates with `schema`; on parse/validation failure retries once, then throws `Error("The AI returned an unexpected response. Please try again.")`.

- [ ] **Step 1: Create `src/ai/client.ts`**

```ts
import Anthropic from "@anthropic-ai/sdk";
import type { ZodType } from "zod";

export const MODEL = "claude-sonnet-5";

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
  return new Anthropic({ apiKey });
}

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

async function callOnce<T>(
  client: Anthropic,
  opts: { system: string; user: string; schema: ZodType<T>; maxTokens: number },
): Promise<T> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  const block = res.content.find((b) => b.type === "text");
  const text = block && block.type === "text" ? block.text : "";
  const parsed = JSON.parse(stripFences(text));
  return opts.schema.parse(parsed);
}

export async function completeJson<T>(opts: {
  system: string;
  user: string;
  schema: ZodType<T>;
  maxTokens?: number;
}): Promise<T> {
  const client = getAnthropic();
  const args = { ...opts, maxTokens: opts.maxTokens ?? 2048 };
  try {
    return await callOnce(client, args);
  } catch {
    try {
      return await callOnce(client, args);
    } catch {
      throw new Error("The AI returned an unexpected response. Please try again.");
    }
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/ai/client.ts
git commit -m "feat: add Anthropic client with JSON completion + retry"
```

---

### Task 6: Resume extraction (LLM)

**Files:**
- Create: `src/ai/extractResume.ts`
- Test: `src/ai/extractResume.test.ts`

**Interfaces:**
- Consumes: `completeJson` from `@/ai/client`, `resumeSchema`.
- Produces: `extractResume(resumeText: string) -> Promise<Resume>`.

- [ ] **Step 1: Write the failing test `src/ai/extractResume.test.ts`**

Mock the client module so no network call happens.

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const completeJson = vi.fn();
vi.mock("@/ai/client", () => ({ completeJson: (...a: unknown[]) => completeJson(...a) }));

import { extractResume } from "@/ai/extractResume";

beforeEach(() => completeJson.mockReset());

describe("extractResume", () => {
  it("passes resume text to the model and returns the parsed resume", async () => {
    const fake = {
      skills: ["ts"], jobTitles: ["dev"], yearsExperience: 2,
      education: [], location: null, contact: {},
    };
    completeJson.mockResolvedValue(fake);
    const result = await extractResume("John Doe, TypeScript developer");
    expect(result).toEqual(fake);
    const arg = completeJson.mock.calls[0][0];
    expect(arg.user).toContain("John Doe");
    expect(arg.schema).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ai/extractResume.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/ai/extractResume.ts`**

```ts
import { completeJson } from "@/ai/client";
import { resumeSchema } from "@/lib/schemas";
import type { Resume } from "@/types";

const SYSTEM = `You extract structured data from resumes. Respond with ONLY a JSON object matching:
{ "skills": string[], "jobTitles": string[], "yearsExperience": number,
  "education": string[], "location": string | null,
  "contact": { "name"?: string, "email"?: string, "phone"?: string } }
Use [] or null when a field is absent. Do not invent data.`;

export async function extractResume(resumeText: string): Promise<Resume> {
  return completeJson({
    system: SYSTEM,
    user: `Resume text:\n\n${resumeText}`,
    schema: resumeSchema,
    maxTokens: 1500,
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/ai/extractResume.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ai/extractResume.ts src/ai/extractResume.test.ts
git commit -m "feat: add LLM resume extraction"
```

---

### Task 7: Resume upload route

**Files:**
- Create: `src/app/api/resume/route.ts`

**Interfaces:**
- Consumes: `validateResumeFile`, `parsePdf`, `extractResume`.
- Produces: `POST /api/resume` — accepts `multipart/form-data` with field `file`; returns `{ data: Resume }` or `{ error }`.

- [ ] **Step 1: Create `src/app/api/resume/route.ts`**

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Create `.env` with a real `ANTHROPIC_API_KEY`, then run `npm run dev` and:
```bash
curl -s -F "file=@sample-resume.pdf" http://localhost:3000/api/resume
```
Expected: JSON `{ "data": { "skills": [...], ... } }`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/resume/route.ts
git commit -m "feat: add resume upload + parse route"
```

---

### Task 8: Arbetnow job source adapter

**Files:**
- Create: `src/services/jobs/arbetnow.ts`

**Interfaces:**
- Consumes: `arbetnowResponseSchema`.
- Produces: `searchArbetnow(query: string, opts?: { remote?: boolean }) -> Promise<RawJob[]>` where `RawJob` is the element type of `arbetnowResponseSchema["data"]`. Throws `Error("Could not reach the job service.")` on network failure.

- [ ] **Step 1: Create `src/services/jobs/arbetnow.ts`**

```ts
import { arbetnowResponseSchema } from "@/lib/schemas";
import type { z } from "zod";

export type RawJob = z.infer<typeof arbetnowResponseSchema>["data"][number];

const ENDPOINT = "https://www.arbeitnow.com/api/job-board-api";

export async function searchArbetnow(
  query: string,
  opts: { remote?: boolean } = {},
): Promise<RawJob[]> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, { headers: { accept: "application/json" } });
  } catch {
    throw new Error("Could not reach the job service.");
  }
  if (!res.ok) throw new Error("Could not reach the job service.");
  const json = await res.json();
  const { data } = arbetnowResponseSchema.parse(json);

  const q = query.trim().toLowerCase();
  return data.filter((job) => {
    if (opts.remote && !job.remote) return false;
    if (!q) return true;
    const haystack = `${job.title} ${job.description} ${job.tags.join(" ")}`.toLowerCase();
    return haystack.includes(q);
  });
}
```

Note: Arbetnow's public endpoint returns a page of recent jobs and has no query param, so filtering is client-of-API side here. Tested indirectly via normalize (Task 9) and the route (Task 10).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/jobs/arbetnow.ts
git commit -m "feat: add Arbetnow job source adapter"
```

---

### Task 9: Normalize & dedupe jobs

**Files:**
- Create: `src/services/jobs/normalize.ts`
- Test: `src/services/jobs/normalize.test.ts`

**Interfaces:**
- Consumes: `RawJob` from `@/services/jobs/arbetnow`, `Job` type.
- Produces: `normalizeJobs(raw: RawJob[]) -> Job[]` — maps to `Job`, dedupes by `id` (Arbetnow `slug`), preserving first occurrence.

- [ ] **Step 1: Write the failing test `src/services/jobs/normalize.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { normalizeJobs } from "@/services/jobs/normalize";
import type { RawJob } from "@/services/jobs/arbetnow";

const raw = (over: Partial<RawJob>): RawJob => ({
  slug: "a", company_name: "Acme", title: "Dev", description: "desc",
  remote: true, url: "http://x", tags: ["ts"], job_types: ["full_time"],
  location: "Berlin", created_at: 1_700_000_000, ...over,
});

describe("normalizeJobs", () => {
  it("maps raw fields to the common Job shape", () => {
    const [job] = normalizeJobs([raw({})]);
    expect(job).toMatchObject({
      id: "a", title: "Dev", company: "Acme", location: "Berlin",
      remote: true, url: "http://x", description: "desc", tags: ["ts"],
    });
    expect(job.postedDate).toBe(new Date(1_700_000_000 * 1000).toISOString());
  });

  it("dedupes by slug, keeping the first", () => {
    const jobs = normalizeJobs([raw({ title: "First" }), raw({ title: "Second" })]);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe("First");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/jobs/normalize.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/services/jobs/normalize.ts`**

```ts
import type { RawJob } from "@/services/jobs/arbetnow";
import type { Job } from "@/types";

export function normalizeJobs(raw: RawJob[]): Job[] {
  const seen = new Set<string>();
  const jobs: Job[] = [];
  for (const r of raw) {
    if (seen.has(r.slug)) continue;
    seen.add(r.slug);
    jobs.push({
      id: r.slug,
      title: r.title,
      company: r.company_name,
      location: r.location,
      remote: r.remote,
      url: r.url,
      description: r.description,
      postedDate: new Date(r.created_at * 1000).toISOString(),
      tags: r.tags,
    });
  }
  return jobs;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/services/jobs/normalize.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/services/jobs/normalize.ts src/services/jobs/normalize.test.ts
git commit -m "feat: add job normalization and dedupe"
```

---

### Task 10: Job search route

**Files:**
- Create: `src/app/api/jobs/route.ts`

**Interfaces:**
- Consumes: `searchArbetnow`, `normalizeJobs`.
- Produces: `POST /api/jobs` — body `{ query: string; remote?: boolean }`; returns `{ data: Job[] }` or `{ error }`.

- [ ] **Step 1: Create `src/app/api/jobs/route.ts`**

```ts
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
```

- [ ] **Step 2: Typecheck & smoke test**

Run: `npm run typecheck`
Run (with `npm run dev` up):
```bash
curl -s -X POST http://localhost:3000/api/jobs -H "content-type: application/json" -d '{"query":"react","remote":true}'
```
Expected: `{ "data": [ { "id": ..., "title": ... }, ... ] }`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/jobs/route.ts
git commit -m "feat: add job search route"
```

---

### Task 11: Job matching (LLM)

**Files:**
- Create: `src/ai/matchJobs.ts`
- Test: `src/ai/matchJobs.test.ts`

**Interfaces:**
- Consumes: `completeJson`, `matchResultsSchema`, `Resume`, `Job`.
- Produces: `matchJobs(resume: Resume, jobs: Job[]) -> Promise<MatchResult[]>`. Returns `[]` when `jobs` is empty (no LLM call).

- [ ] **Step 1: Write the failing test `src/ai/matchJobs.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const completeJson = vi.fn();
vi.mock("@/ai/client", () => ({ completeJson: (...a: unknown[]) => completeJson(...a) }));

import { matchJobs } from "@/ai/matchJobs";
import type { Resume, Job } from "@/types";

const resume: Resume = {
  skills: ["ts"], jobTitles: ["dev"], yearsExperience: 2,
  education: [], location: null, contact: {},
};
const job: Job = {
  id: "j1", title: "Dev", company: "Acme", location: "Berlin", remote: true,
  url: "http://x", description: "TypeScript role", postedDate: "2026-01-01T00:00:00.000Z", tags: ["ts"],
};

beforeEach(() => completeJson.mockReset());

describe("matchJobs", () => {
  it("returns [] without calling the model when there are no jobs", async () => {
    const result = await matchJobs(resume, []);
    expect(result).toEqual([]);
    expect(completeJson).not.toHaveBeenCalled();
  });

  it("returns parsed match results", async () => {
    completeJson.mockResolvedValue([{ jobId: "j1", score: 80, missingSkills: [], reason: "ok" }]);
    const result = await matchJobs(resume, [job]);
    expect(result[0]).toEqual({ jobId: "j1", score: 80, missingSkills: [], reason: "ok" });
    expect(completeJson.mock.calls[0][0].user).toContain("j1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ai/matchJobs.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/ai/matchJobs.ts`**

```ts
import { completeJson } from "@/ai/client";
import { matchResultsSchema } from "@/lib/schemas";
import type { Resume, Job, MatchResult } from "@/types";

const SYSTEM = `You compare a candidate resume against job listings.
For EACH job, output an object: { "jobId": string, "score": integer 0-100,
"missingSkills": string[], "reason": string (one sentence) }.
Respond with ONLY a JSON array of these objects, one per job, using the given jobId values.`;

export async function matchJobs(resume: Resume, jobs: Job[]): Promise<MatchResult[]> {
  if (jobs.length === 0) return [];
  const compactJobs = jobs.map((j) => ({
    jobId: j.id, title: j.title, company: j.company, tags: j.tags,
    description: j.description.slice(0, 600),
  }));
  const user = `Candidate:\n${JSON.stringify({
    skills: resume.skills, jobTitles: resume.jobTitles, yearsExperience: resume.yearsExperience,
  })}\n\nJobs:\n${JSON.stringify(compactJobs)}`;

  return completeJson({ system: SYSTEM, user, schema: matchResultsSchema, maxTokens: 4096 });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/ai/matchJobs.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ai/matchJobs.ts src/ai/matchJobs.test.ts
git commit -m "feat: add LLM job matching"
```

---

### Task 12: Match route

**Files:**
- Create: `src/app/api/match/route.ts`

**Interfaces:**
- Consumes: `matchJobs`, `resumeSchema`.
- Produces: `POST /api/match` — body `{ resume: Resume; jobs: Job[] }`; returns `{ data: MatchResult[] }` or `{ error }`.

- [ ] **Step 1: Create `src/app/api/match/route.ts`**

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/match/route.ts
git commit -m "feat: add match route"
```

---

### Task 13: Ranking

**Files:**
- Create: `src/lib/rank.ts`
- Test: `src/lib/rank.test.ts`

**Interfaces:**
- Consumes: `Job`, `MatchResult`.
- Produces: `type RankedJob = Job & { match: MatchResult }`; `rankJobs(jobs: Job[], matches: MatchResult[]) -> RankedJob[]` — joins by id (drops jobs with no match), sorts by score desc then postedDate desc.

- [ ] **Step 1: Write the failing test `src/lib/rank.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { rankJobs } from "@/lib/rank";
import type { Job, MatchResult } from "@/types";

const job = (id: string, postedDate: string): Job => ({
  id, title: "T", company: "C", location: "L", remote: false,
  url: "u", description: "d", postedDate, tags: [],
});
const match = (jobId: string, score: number): MatchResult =>
  ({ jobId, score, missingSkills: [], reason: "" });

describe("rankJobs", () => {
  it("sorts by score desc, then postedDate desc", () => {
    const jobs = [
      job("a", "2026-01-01T00:00:00.000Z"),
      job("b", "2026-02-01T00:00:00.000Z"),
      job("c", "2026-03-01T00:00:00.000Z"),
    ];
    const matches = [match("a", 90), match("b", 90), match("c", 50)];
    const ranked = rankJobs(jobs, matches);
    expect(ranked.map((j) => j.id)).toEqual(["b", "a", "c"]);
  });

  it("drops jobs without a match", () => {
    const ranked = rankJobs([job("a", "2026-01-01T00:00:00.000Z")], []);
    expect(ranked).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/rank.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/lib/rank.ts`**

```ts
import type { Job, MatchResult } from "@/types";

export type RankedJob = Job & { match: MatchResult };

export function rankJobs(jobs: Job[], matches: MatchResult[]): RankedJob[] {
  const byId = new Map(matches.map((m) => [m.jobId, m]));
  const ranked: RankedJob[] = [];
  for (const job of jobs) {
    const match = byId.get(job.id);
    if (match) ranked.push({ ...job, match });
  }
  ranked.sort((a, b) => {
    if (b.match.score !== a.match.score) return b.match.score - a.match.score;
    return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
  });
  return ranked;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/rank.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/rank.ts src/lib/rank.test.ts
git commit -m "feat: add job ranking"
```

---

### Task 14: Client API helpers & hooks

**Files:**
- Create: `src/lib/api.ts`
- Create: `src/hooks/useResumeUpload.ts`
- Create: `src/hooks/useJobMatches.ts`

**Interfaces:**
- Consumes: routes from Tasks 7, 10, 12; `rankJobs`.
- Produces:
  - `api.uploadResume(file: File) -> Promise<Resume>`
  - `api.searchJobs(query: string, remote: boolean) -> Promise<Job[]>`
  - `api.matchJobs(resume: Resume, jobs: Job[]) -> Promise<MatchResult[]>`
  - `useResumeUpload()` → React Query mutation returning `Resume`.
  - `useJobMatches()` → mutation taking `{ resume, query, remote }`, runs search then match, returns `RankedJob[]`.

- [ ] **Step 1: Create `src/lib/api.ts`**

```ts
import type { Resume, Job, MatchResult } from "@/types";

async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({ error: "Unexpected server response." }));
  if (!res.ok) throw new Error(json.error ?? "Request failed.");
  return json.data as T;
}

export const api = {
  async uploadResume(file: File): Promise<Resume> {
    const form = new FormData();
    form.append("file", file);
    return unwrap<Resume>(await fetch("/api/resume", { method: "POST", body: form }));
  },
  async searchJobs(query: string, remote: boolean): Promise<Job[]> {
    return unwrap<Job[]>(
      await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, remote }),
      }),
    );
  },
  async matchJobs(resume: Resume, jobs: Job[]): Promise<MatchResult[]> {
    return unwrap<MatchResult[]>(
      await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resume, jobs }),
      }),
    );
  },
};
```

- [ ] **Step 2: Create `src/hooks/useResumeUpload.ts`**

```ts
"use client";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Resume } from "@/types";

export function useResumeUpload() {
  return useMutation<Resume, Error, File>({ mutationFn: (file) => api.uploadResume(file) });
}
```

- [ ] **Step 3: Create `src/hooks/useJobMatches.ts`**

```ts
"use client";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { rankJobs, type RankedJob } from "@/lib/rank";
import type { Resume } from "@/types";

type Input = { resume: Resume; query: string; remote: boolean };

export function useJobMatches() {
  return useMutation<RankedJob[], Error, Input>({
    mutationFn: async ({ resume, query, remote }) => {
      const jobs = await api.searchJobs(query, remote);
      const matches = await api.matchJobs(resume, jobs);
      return rankJobs(jobs, matches);
    },
  });
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api.ts src/hooks
git commit -m "feat: add client API helpers and React Query hooks"
```

---

### Task 15: UI components & dashboard

**Files:**
- Create: `src/components/UploadDropzone.tsx`
- Create: `src/components/SearchForm.tsx`
- Create: `src/components/MatchBadge.tsx`
- Create: `src/components/JobCard.tsx`
- Modify: `src/app/page.tsx` (replace placeholder)

**Interfaces:**
- Consumes: hooks from Task 14, `validateResumeFile`, `RankedJob`.
- Produces: dashboard wiring upload → search → ranked cards, with in-memory saved set.

- [ ] **Step 1: Create `src/components/MatchBadge.tsx`**

```tsx
export function MatchBadge({ score }: { score: number }) {
  const color = score >= 75 ? "bg-green-100 text-green-800"
    : score >= 50 ? "bg-yellow-100 text-yellow-800"
    : "bg-gray-100 text-gray-700";
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${color}`}>{score}% match</span>;
}
```

- [ ] **Step 2: Create `src/components/UploadDropzone.tsx`**

```tsx
"use client";
import { useRef } from "react";
import { validateResumeFile } from "@/resume/validate";

export function UploadDropzone({
  onFile, isLoading, error,
}: { onFile: (file: File) => void; isLoading: boolean; error?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | undefined>();

  function handle(file: File | undefined) {
    if (!file) return;
    const check = validateResumeFile({ type: file.type, size: file.size });
    if (!check.ok) { setLocalError(check.error); return; }
    setLocalError(undefined);
    onFile(file);
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
        onChange={(e) => handle(e.target.files?.[0])} />
      <button onClick={() => inputRef.current?.click()} disabled={isLoading}
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
        {isLoading ? "Reading resume…" : "Upload PDF resume"}
      </button>
      {(localError ?? error) && <p className="mt-3 text-sm text-red-600">{localError ?? error}</p>}
    </div>
  );
}
```

Add the missing import at the top: `import { useRef, useState } from "react";` (replace the `useRef`-only import).

- [ ] **Step 3: Create `src/components/SearchForm.tsx`**

```tsx
"use client";
import { useState } from "react";

export function SearchForm({
  onSearch, isLoading,
}: { onSearch: (query: string, remote: boolean) => void; isLoading: boolean }) {
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState(false);
  return (
    <form className="flex flex-wrap items-center gap-3"
      onSubmit={(e) => { e.preventDefault(); onSearch(query, remote); }}>
      <input value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder="Job title, skill, or location"
        className="flex-1 rounded border border-gray-300 px-3 py-2" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} />
        Remote only
      </label>
      <button type="submit" disabled={isLoading}
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
        {isLoading ? "Matching…" : "Find jobs"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Create `src/components/JobCard.tsx`**

```tsx
"use client";
import Link from "next/link";
import { MatchBadge } from "@/components/MatchBadge";
import type { RankedJob } from "@/lib/rank";

export function JobCard({
  job, saved, onToggleSave,
}: { job: RankedJob; saved: boolean; onToggleSave: (id: string) => void }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/job/${job.id}`} className="text-lg font-semibold hover:underline">{job.title}</Link>
          <p className="text-sm text-gray-600">{job.company} · {job.location}{job.remote ? " · Remote" : ""}</p>
        </div>
        <MatchBadge score={job.match.score} />
      </div>
      {job.salary && <p className="mt-2 text-sm text-gray-700">{job.salary}</p>}
      <p className="mt-2 text-sm text-gray-700">{job.match.reason}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {job.tags.slice(0, 6).map((t) => (
          <span key={t} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{t}</span>
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        <a href={job.url} target="_blank" rel="noreferrer"
          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white">Apply</a>
        <button onClick={() => onToggleSave(job.id)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm">
          {saved ? "Saved ✓" : "Save"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Replace `src/app/page.tsx`**

```tsx
"use client";
import { useState } from "react";
import { UploadDropzone } from "@/components/UploadDropzone";
import { SearchForm } from "@/components/SearchForm";
import { JobCard } from "@/components/JobCard";
import { useResumeUpload } from "@/hooks/useResumeUpload";
import { useJobMatches } from "@/hooks/useJobMatches";
import type { Resume } from "@/types";

export default function Home() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const upload = useResumeUpload();
  const matches = useJobMatches();

  function toggleSave(id: string) {
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">AI Job Finder</h1>

      {!resume ? (
        <UploadDropzone
          isLoading={upload.isPending}
          error={upload.error?.message}
          onFile={(file) => upload.mutate(file, { onSuccess: setResume })}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-600">
            Resume loaded · {resume.skills.slice(0, 5).join(", ")}
          </p>
          <SearchForm
            isLoading={matches.isPending}
            onSearch={(query, remote) => matches.mutate({ resume, query, remote })}
          />
          {matches.isError && <p className="mt-4 text-sm text-red-600">{matches.error.message}</p>}
          <div className="mt-6 space-y-4">
            {matches.data?.length === 0 && <p className="text-gray-600">No matching jobs found.</p>}
            {matches.data?.map((job) => (
              <JobCard key={job.id} job={job} saved={saved.has(job.id)} onToggleSave={toggleSave} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 6: Typecheck & run**

Run: `npm run typecheck`
Run: `npm run dev`, open `http://localhost:3000`, upload a PDF, search, confirm ranked cards render with match %, Apply link, and Save toggle.

- [ ] **Step 7: Commit**

```bash
git add src/components src/app/page.tsx
git commit -m "feat: add dashboard UI components and wiring"
```

---

### Task 16: Job detail page

**Files:**
- Create: `src/app/job/[id]/page.tsx`
- Create: `src/lib/jobStore.ts` (in-memory client cache of last results)
- Modify: `src/hooks/useJobMatches.ts` (populate the store on success)

**Interfaces:**
- Consumes: `RankedJob`.
- Produces: a client-side detail route reading the last-searched jobs from an in-memory store keyed by id.

**Note:** Because there is no database, the detail page reads from an in-memory module store populated by the last search. On a hard refresh the store is empty; the page then shows an "Open the dashboard first" message with a link home. This is an accepted MVP limitation (matches the session-only decision in the spec).

- [ ] **Step 1: Create `src/lib/jobStore.ts`**

```ts
import type { RankedJob } from "@/lib/rank";

let lastResults: RankedJob[] = [];

export function setLastResults(jobs: RankedJob[]) { lastResults = jobs; }
export function getJobById(id: string): RankedJob | undefined {
  return lastResults.find((j) => j.id === id);
}
```

- [ ] **Step 2: Populate the store in `src/hooks/useJobMatches.ts`**

Change the `mutationFn` return to also store results. Replace the function body:

```ts
    mutationFn: async ({ resume, query, remote }) => {
      const jobs = await api.searchJobs(query, remote);
      const matches = await api.matchJobs(resume, jobs);
      const ranked = rankJobs(jobs, matches);
      setLastResults(ranked);
      return ranked;
    },
```

Add import at top: `import { setLastResults } from "@/lib/jobStore";`

- [ ] **Step 3: Create `src/app/job/[id]/page.tsx`**

```tsx
"use client";
import Link from "next/link";
import { use } from "react";
import { getJobById } from "@/lib/jobStore";
import { MatchBadge } from "@/components/MatchBadge";

export default function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const job = getJobById(id);

  if (!job) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-gray-600">This job isn’t loaded.{" "}
          <Link href="/" className="text-blue-600 underline">Open the dashboard first</Link>.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/" className="text-sm text-blue-600 underline">← Back</Link>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-gray-600">{job.company} · {job.location}{job.remote ? " · Remote" : ""}</p>
        </div>
        <MatchBadge score={job.match.score} />
      </div>
      {job.salary && <p className="mt-2 text-gray-700">{job.salary}</p>}
      <p className="mt-4 font-semibold">Why this matches</p>
      <p className="text-gray-700">{job.match.reason}</p>
      {job.match.missingSkills.length > 0 && (
        <>
          <p className="mt-4 font-semibold">Skills to highlight or learn</p>
          <ul className="list-inside list-disc text-gray-700">
            {job.match.missingSkills.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </>
      )}
      <p className="mt-4 font-semibold">Description</p>
      <p className="whitespace-pre-line text-gray-700">{job.description}</p>
      <a href={job.url} target="_blank" rel="noreferrer"
        className="mt-6 inline-block rounded bg-blue-600 px-4 py-2 text-white">Apply on site</a>
    </main>
  );
}
```

- [ ] **Step 4: Typecheck & run**

Run: `npm run typecheck`
Run: `npm run dev`, search on the dashboard, click a card title, confirm the detail page renders and "Apply on site" links out.

- [ ] **Step 5: Commit**

```bash
git add src/lib/jobStore.ts src/hooks/useJobMatches.ts src/app/job
git commit -m "feat: add job detail page with in-memory store"
```

---

### Task 17: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all suites pass (schemas, validate, extractResume, normalize, matchJobs, rank).

- [ ] **Step 2: Typecheck and build**

Run: `npm run typecheck`
Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 3: End-to-end manual check**

With a real `ANTHROPIC_API_KEY` in `.env` and `npm run dev`:
1. Upload a PDF resume → resume summary appears.
2. Enter a query (e.g. "react"), toggle remote, Find jobs → ranked cards with match %.
3. Save a card → button flips to "Saved ✓".
4. Open a card → detail page shows reason, missing skills, description, Apply link.
5. Upload a non-PDF / oversized file → clear inline error.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore: final MVP verification fixes"
```

---

## Self-Review Notes

- **Spec coverage:** upload+validation (T3,T7,T15), PDF parse (T4), LLM extraction (T6), Arbetnow source (T8), normalize+dedupe (T9), location/remote filter (T8,T10,T15), AI match JSON (T11,T12), ranking score→date (T13), dashboard cards (T15), detail page (T16), error handling (route-level each task + UI in T15), unit tests (T2,T3,T6,T9,T11,T13). DOCX, extra sources, salary tiebreak, logos, persistence, animations are explicitly deferred per spec.
- **Type consistency:** `Resume`, `Job`, `MatchResult`, `RawJob`, `RankedJob` names used consistently across tasks; `completeJson`, `rankJobs`, `normalizeJobs`, `searchArbetnow`, `matchJobs`, `extractResume`, `validateResumeFile` signatures match between producer and consumer tasks.
- **No placeholders:** every code step contains full code; smoke tests specify exact commands and expected output.
