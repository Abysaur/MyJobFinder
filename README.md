# AI Job Finder

Upload your résumé and see which jobs actually fit — every listing scored
`0–100` against your skills and experience, with a plain-language reason and the
gaps to close before you apply.

It reads your résumé once with Claude, searches multiple job boards at the same
time, and ranks the results by how well they match you — not by keyword count.

## How it works

```
PDF résumé ──▶ parse text ──▶ Claude extracts skills/experience
                                          │
   keyword search ──▶ providers (concurrent) ──┐
   Arbeitnow · Bundesagentur · Adzuna          │
                                          ▼     ▼
                          merge · dedupe · Claude scores fit ──▶ ranked results
```

1. **Résumé intake** — the PDF is parsed to text (`pdf-parse`) and Claude
   extracts structured skills, job titles, years of experience, and location.
2. **Search** — a keyword query fans out to every configured job provider
   concurrently.
3. **Match** — Claude compares your résumé against each listing and returns a
   fit score, a one-line reason, and any missing skills.
4. **Rank** — results are merged, deduplicated, sorted, and shown highest-fit
   first. Roles scoring below 50 are hidden.

You can edit your target role and add or remove skills to sharpen the next
search.

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** with a fluid, theme-aware design system
- **Framer Motion** for spring-based motion
- **TanStack Query** for client data fetching
- **Anthropic SDK** (Claude `claude-sonnet-5`) for résumé extraction and matching
- **Zod** for schema validation, **Vitest** for tests

## Getting started

### Prerequisites

- Node.js `>= 18.17`
- An [Anthropic API key](https://console.anthropic.com/)

### Install

```bash
npm install
```

### Configure

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

| Variable            | Required | Purpose                                                        |
| ------------------- | -------- | -------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | Yes      | Résumé extraction and job matching                             |
| `BA_API_KEY`        | No       | Enables the Bundesagentur für Arbeit (BA) provider             |
| `BA_BASE_URL`       | No       | BA API base URL (defaults to the public jobsuche-service host) |
| `ADZUNA_APP_ID`     | No       | Enables the Adzuna provider (with `ADZUNA_APP_KEY`)            |
| `ADZUNA_APP_KEY`    | No       | Adzuna API key                                                 |
| `ADZUNA_COUNTRY`    | No       | Two-letter Adzuna country code (defaults to `de`)              |

Each job provider is optional and activates only when its keys are present. With
no provider keys set, the app still works using the free Arbeitnow board.

### Run

```bash
npm run dev      # start the dev server (http://localhost:3000)
npm run build    # production build
npm run start    # serve the production build
npm run test     # run the test suite
npm run typecheck
```

## Job providers

All sources implement a common `JobProvider` interface, so adding another board
is one module plus one line in the registry. Providers are queried concurrently;
if one fails, its error is logged and the others still return results.

| Provider                    | Notes                                                    |
| --------------------------- | -------------------------------------------------------- |
| **Arbeitnow**               | No key required; the default fallback source             |
| **Bundesagentur für Arbeit**| German federal employment agency; auth via `X-API-Key`   |
| **Adzuna**                  | Multi-country aggregator; keyword, location, salary sort |

Each provider normalizes its response into a single internal `Job` shape.
Results are then merged, deduplicated (same role at the same company counts
once), sorted (relevance, date, or salary), and paginated.

## Project structure

```
src/
├─ app/                 # Next.js routes + API endpoints
│  ├─ api/resume/       # PDF upload → parse → extract
│  ├─ api/jobs/         # keyword search across providers
│  ├─ api/match/        # score listings against a résumé
│  └─ job/[id]/         # job detail page
├─ ai/                  # Claude client, résumé extraction, job matching
├─ components/          # UI (upload, search, job card, fit gauge)
├─ hooks/               # TanStack Query hooks
├─ services/jobs/       # provider interface, providers, aggregator
│  ├─ provider.ts       # JobProvider interface + query normalization
│  ├─ adzuna.ts         # Adzuna provider + normalizer
│  ├─ ba.ts             # Bundesagentur provider + normalizer
│  ├─ arbetnow.ts       # Arbeitnow provider
│  └─ aggregate.ts      # concurrent fetch, merge, dedupe, sort, paginate
├─ resume/              # PDF parsing + file validation
└─ lib/                 # schemas, ranking, API client
```

## Testing

```bash
npm run test
```

Unit tests cover résumé and job schemas, ranking, file validation, the AI JSON
client, and each job provider and the aggregator (with mocked API responses).

## Notes

- The BA and Adzuna integrations are built against the providers' documented
  response shapes and validated with representative mocks. When you add live
  keys, smoke-test one call per provider and adjust field mappings if the real
  responses differ.
- Cross-provider pagination is approximate: each provider paginates its own
  result set, which the aggregator then merges and slices per page.
