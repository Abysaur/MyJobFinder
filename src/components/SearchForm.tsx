"use client";
import { useState } from "react";

export function SearchForm({
  onSearch,
  isLoading,
}: {
  onSearch: (query: string, remote: boolean) => void;
  isLoading: boolean;
}) {
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState(false);

  return (
    <form
      className="panel"
      style={{ padding: "clamp(1rem, 2.5vw, 1.35rem)" }}
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(query, remote);
      }}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <label htmlFor="scan-query" className="eyebrow">
          search
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={remote}
            onChange={(e) => setRemote(e.target.checked)}
            className="h-4 w-4 rounded accent-[var(--signal)]"
          />
          <span className="label-soft">remote only</span>
        </label>
      </div>
      <div className="flex flex-wrap items-stretch gap-2.5">
        <input
          id="scan-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Job title, skill, or location"
          className="input-field min-w-0 flex-1"
        />
        <button type="submit" disabled={isLoading} className="btn-signal">
          {isLoading ? "Searching…" : "Find jobs"}
        </button>
      </div>
    </form>
  );
}
