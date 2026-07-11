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
