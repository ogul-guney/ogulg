import { useState, useMemo } from 'react';
import { Post, YearArchiveGroup } from '../types.ts';
import { getFullMonthName } from '../lib/dateUtils.ts';
import { PostItem } from './PostItem.tsx';

interface ArchiveViewProps {
  posts: Post[];
  onBack: () => void;
  onUpdatePost: (id: string, newContent: string) => Promise<boolean>;
  onDeletePost: (id: string) => Promise<boolean>;
}

export function ArchiveView({
  posts,
  onBack,
  onUpdatePost,
  onDeletePost,
}: ArchiveViewProps) {
  // Selected month filter: e.g. { year: 2026, month: 8 } (where 8 is September)
  const [selectedPeriod, setSelectedPeriod] = useState<{
    year: number;
    monthIndex: number;
    monthName: string;
  } | null>(null);

  // Group posts by Year and Month
  const archiveGroups = useMemo<YearArchiveGroup[]>(() => {
    const yearMap = new Map<number, { total: number; months: Map<number, number> }>();

    posts.forEach((post) => {
      const d = new Date(post.created_at);
      if (isNaN(d.getTime())) return;
      const year = d.getFullYear();
      const month = d.getMonth();

      if (!yearMap.has(year)) {
        yearMap.set(year, { total: 0, months: new Map() });
      }
      const yData = yearMap.get(year)!;
      yData.total += 1;
      yData.months.set(month, (yData.months.get(month) || 0) + 1);
    });

    // Sort descending by year
    const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b - a);

    return sortedYears.map((year) => {
      const { total, months } = yearMap.get(year)!;
      // Sort months descending
      const sortedMonths = Array.from(months.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([mIdx, count]) => ({
          monthName: getFullMonthName(mIdx),
          monthIndex: mIdx,
          count,
        }));

      return {
        year,
        totalCount: total,
        months: sortedMonths,
      };
    });
  }, [posts]);

  // Filtered posts if a period is selected
  const periodPosts = useMemo(() => {
    if (!selectedPeriod) return [];
    return posts.filter((p) => {
      const d = new Date(p.created_at);
      return (
        d.getFullYear() === selectedPeriod.year &&
        d.getMonth() === selectedPeriod.monthIndex
      );
    });
  }, [posts, selectedPeriod]);

  return (
    <div className="py-6">
      {/* Top navigation */}
      <div className="pb-6 border-b border-neutral-200/50 dark:border-neutral-800/80 flex items-center justify-between">
        <button
          onClick={() => {
            if (selectedPeriod) {
              setSelectedPeriod(null);
            } else {
              onBack();
            }
          }}
          className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors flex items-center gap-1 font-mono cursor-pointer"
        >
          {selectedPeriod ? '← Back to All Archive Years' : '← Return to Timeline'}
        </button>

        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          {selectedPeriod
            ? `${selectedPeriod.monthName} ${selectedPeriod.year}`
            : 'Historical Archive'}
        </span>
      </div>

      {/* If viewing a selected month */}
      {selectedPeriod ? (
        <div className="pt-6">
          <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800 flex items-baseline justify-between">
            <h2 className="text-xl sm:text-2xl font-light tracking-tight text-neutral-900 dark:text-neutral-100">
              {selectedPeriod.monthName} {selectedPeriod.year}
            </h2>
            <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500">
              {periodPosts.length} {periodPosts.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          <div className="divide-y-0">
            {periodPosts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                onUpdate={onUpdatePost}
                onDelete={onDeletePost}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Overall Archive Directory grouped by Year & Month */
        <div className="pt-8 space-y-12">
          {archiveGroups.length === 0 ? (
            <div className="py-20 text-center text-neutral-400 dark:text-neutral-500 text-sm">
              Archive records are currently empty.
            </div>
          ) : (
            archiveGroups.map((group) => (
              <section key={group.year} className="space-y-4">
                {/* Year Header */}
                <div className="flex items-baseline justify-between border-b border-neutral-300 dark:border-neutral-700 pb-2">
                  <span className="text-2xl sm:text-3xl font-light tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">
                    {group.year}
                  </span>
                  <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500">
                    {group.totalCount} {group.totalCount === 1 ? 'post' : 'posts'}
                  </span>
                </div>

                {/* Months list */}
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {group.months.map((m) => (
                    <button
                      key={m.monthIndex}
                      onClick={() =>
                        setSelectedPeriod({
                          year: group.year,
                          monthIndex: m.monthIndex,
                          monthName: m.monthName,
                        })
                      }
                      className="w-full py-3 flex items-center justify-between text-left hover:text-[#c0392b] dark:hover:text-[#e05345] group transition-colors cursor-pointer"
                    >
                      <span className="text-[15px] sm:text-[16px] text-neutral-700 dark:text-neutral-300 group-hover:text-[#c0392b] dark:group-hover:text-[#e05345] transition-colors">
                        {m.monthName}
                      </span>
                      <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
                        {m.count}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}
    </div>
  );
}
