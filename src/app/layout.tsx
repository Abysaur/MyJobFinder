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
