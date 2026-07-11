# AI Job Finder — MVP Design

**Date:** 2026-07-11
**Status:** Approved (design), pending implementation plan

## 1. Goal & Scope

Deliver the smallest product that proves the core value: **upload a resume → see real jobs ranked by how well they match you.**

The two riskiest, highest-value pieces are AI resume extraction and AI job matching. The MVP proves both end-to-end with minimal surrounding scaffolding, then leaves room to layer on more job sources and polish.

### In scope (MVP)

- Single-page Next.js (App Router) app. No auth, no database. Session-only state in the browser.
- Resume upload: **PDF only**, with type + size validation and error handling.
- Parse with `pdf-parse`, then one LLM call to extract structured data (skills, job titles, experience, education, location, contact).
- **One job source: Arbetnow** (free public REST API, no keys, no scraping).
- Location filter: text input + remote toggle passed to search.
- AI matching: one LLM call per batch of jobs returning match score, missing skills, and a one-line reason as structured JSON.
- Ranking: by match score, then posted date.
- Responsive dashboard: job cards (title, company, salary, location, match %, top skills) + a detail view.
- **Save** = in-memory list. **Apply** = link out to the original posting.
- Unit tests for pure logic.

### Deferred (post-MVP)

- DOCX support (mammoth)
- Indeed / LinkedIn sources and cross-source dedup/merge
- Rich "strengths / recommendations" analysis (MVP does score + missing skills + reason)
- Salary-based tiebreak in ranking
- Company logos
- Persistence / accounts / saved searches
- Framer Motion animations

## 2. Architecture

A single Next.js App Router app — no separate backend, no database. Server-side work (parsing, LLM calls, job fetching) runs in Route Handlers (`app/api/*`) so the Anthropic API key and job-source calls stay server-side. The browser holds session state (resume data, results, saved list) via React Query cache plus a small context. Nothing persists across refresh in the MVP.

```
Browser (client)                    Server (route handlers)              External
─────────────────                   ───────────────────────             ────────
Upload UI ──────► POST /api/resume ─► parse (pdf-parse) ─► LLM extract ─► Anthropic
Search form ────► POST /api/jobs ───► ArbetnowService ──────────────────► Arbetnow API
                                        └─► normalize + dedup
Results ────────► POST /api/match ──► MatchService ─► LLM score ────────► Anthropic
Dashboard ◄──── ranked results (client-side rank)
```

## 3. Module Structure

```
src/
  app/
    api/resume/route.ts      # upload → parse → extract
    api/jobs/route.ts        # search jobs
    api/match/route.ts       # score resume vs jobs
    page.tsx                 # dashboard
    job/[id]/page.tsx        # detail view
  components/                # JobCard, UploadDropzone, SearchForm, MatchBadge, ...
  services/
    jobs/arbetnow.ts         # source adapter
    jobs/normalize.ts        # → common Job shape + dedup
  ai/
    extractResume.ts         # LLM structured extraction
    matchJobs.ts             # LLM scoring
    client.ts                # Anthropic client wrapper
  resume/
    parsePdf.ts              # pdf-parse wrapper
    validate.ts              # type/size checks
  hooks/                     # useResumeUpload, useJobSearch, useMatches
  lib/rank.ts                # sort by score → date
  types/                     # Resume, Job, MatchResult
```

Each unit has one job and a typed interface:
- `ArbetnowService.search(query, location) -> RawJob[]`
- `normalize(RawJob[]) -> Job[]` (also dedups)
- `extractResume(text) -> Resume`
- `matchJobs(resume, Job[]) -> MatchResult[]`
- `rank(jobs, matches) -> Job[]`

## 4. Data Flow & Core Types

```ts
type Resume = {
  skills: string[];
  jobTitles: string[];
  yearsExperience: number;
  education: string[];
  location: string | null;
  contact: { name?: string; email?: string; phone?: string };
};

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  salary?: string;
  url: string;
  description: string;
  postedDate: string;   // ISO
  tags: string[];
};

type MatchResult = {
  jobId: string;
  score: number;        // 0-100
  missingSkills: string[];
  reason: string;       // one line
};
```

Flow: upload → `Resume` → search returns `Job[]` → match returns `MatchResult[]` → client joins Job + Match, ranks via `lib/rank.ts`, renders cards.

## 5. Error Handling

- **Upload:** reject non-PDF, files > 5MB, empty files, and corrupt/unparseable PDFs with clear user-facing messages.
- **LLM:** validate every JSON output against a Zod schema. On malformed output, retry once, then surface a friendly error. Timeouts become retryable states in the hook.
- **Job source:** network errors and empty results handled gracefully (empty state, not a crash).
- Every route handler returns typed `{ data }` or `{ error }`. Hooks expose `isLoading / isError / error`.

## 6. Testing

Vitest for units — the pure logic where bugs hide:
- `services/jobs/normalize.ts` — normalization + dedup
- `lib/rank.ts` — sort order (score → date)
- `resume/validate.ts` — file validation rules
- Zod schema parsing of LLM responses, using fixture JSON

LLM and network calls are mocked. No E2E for MVP.

## 7. Tech Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- React Query (client data/cache)
- Anthropic (Claude) for extraction + matching
- Zod for runtime validation of LLM/API responses
- `pdf-parse` for PDF text extraction
- Vitest for unit tests
- Framer Motion: dependency present but animations deferred; not required for MVP acceptance
