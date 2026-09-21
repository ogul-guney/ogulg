import { useState, useEffect, useMemo, useRef } from 'react';
import { Post } from '../types.ts';
import { searchPosts } from '../lib/supabase.ts';
import { PostItem } from './PostItem.tsx';

interface SearchViewProps {
  onBack: () => void;
  onUpdatePost: (id: string, newContent: string) => Promise<boolean>;
  onDeletePost: (id: string) => Promise<boolean>;
  availableYears: number[];
}

export function SearchView({
  onBack,
  onUpdatePost,
  onDeletePost,
  availableYears,
}: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [results, setResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Perform search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const found = await searchPosts(query, selectedYear);
        setResults(found);
        setHasSearched(true);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, selectedYear]);

  return (
    <div className="py-6">
      {/* Search Header / Input */}
      <div className="pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors flex items-center gap-1 font-mono cursor-pointer"
          >
            ← Return to Timeline
          </button>
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Full-Text Archive Search
          </span>
        </div>

        <div className="relative">
          <input
            ref={inputRef}
            id="search-archive-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type words, phrases, or memories…"
            className="w-full bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-[18px] sm:text-[20px] leading-relaxed py-2 pr-8 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-xs px-1 font-mono cursor-pointer"
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>

        {/* Year filters */}
        {availableYears.length > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-neutral-400 dark:text-neutral-500 text-[11px] font-mono mr-1">Filter year:</span>
            <button
              onClick={() => setSelectedYear(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-mono transition-colors cursor-pointer ${
                selectedYear === null
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-700'
              }`}
            >
              All
            </button>
            {availableYears.map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(selectedYear === yr ? null : yr)}
                className={`px-2.5 py-1 rounded-full text-xs font-mono transition-colors cursor-pointer ${
                  selectedYear === yr
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-700'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result feedback */}
      <div className="pt-4 pb-2 flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500 font-mono">
        {isSearching ? (
          <span>Searching PostgreSQL index…</span>
        ) : hasSearched ? (
          <span>
            {results.length} {results.length === 1 ? 'entry' : 'entries'} found
            {selectedYear ? ` for ${selectedYear}` : ''}
          </span>
        ) : (
          <span>Search spans all archived years</span>
        )}
      </div>

      {/* Results list */}
      <div className="divide-y-0">
        {results.map((post) => (
          <PostItem
            key={post.id}
            post={post}
            onUpdate={async (id, content) => {
              const ok = await onUpdatePost(id, content);
              if (ok) {
                setResults((prev) =>
                  prev.map((p) => (p.id === id ? { ...p, content, updated_at: new Date().toISOString() } : p))
                );
              }
              return ok;
            }}
            onDelete={async (id) => {
              const ok = await onDeletePost(id);
              if (ok) {
                setResults((prev) => prev.filter((p) => p.id !== id));
              }
              return ok;
            }}
            highlightKeyword={query}
          />
        ))}

        {hasSearched && results.length === 0 && !isSearching && (
          <div className="py-20 text-center">
            <p className="text-neutral-400 text-sm">
              No entries found matching "{query}"
            </p>
            <p className="text-neutral-300 text-xs mt-1 font-mono">
              Try searching for different keywords or clearing year filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
