import "./globals.css";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { Providers } from "@/lib/queryClient";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Job Finder — Find where you fit.",
  description:
    "Upload your résumé. Every job scored by how well it actually fits — with the reasons and the gaps, in plain terms.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${instrumentSans.variable}`}>
      <body className="min-h-screen">
        <div
          className="mx-auto flex min-h-screen w-full max-w-4xl flex-col"
          style={{ paddingInline: "clamp(1.1rem, 4vw, 2.5rem)" }}
        >
          <header className="flex items-center justify-between py-5">
            <a href="/" className="flex items-baseline gap-2.5">
              <span className="font-display text-xl font-bold tracking-tight text-[var(--ink)]">
                Job&nbsp;Finder
              </span>
              <span className="label-soft hidden sm:inline">find where you fit</span>
            </a>
            <span className="label-soft flex items-center gap-2">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                  style={{ background: "var(--signal)" }}
                />
                <span
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{ background: "var(--signal)" }}
                />
              </span>
              live
            </span>
          </header>

          <Providers>{children}</Providers>

          <footer className="mt-auto py-6">
            <p className="label-soft">
              Scores are estimates from your résumé — a read on fit, not a verdict.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
