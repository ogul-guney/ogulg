import { ViewMode } from '../types.ts';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onTriggerRandom: () => void;
  postCount?: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Header({
  currentView,
  onSelectView,
  onTriggerRandom,
  postCount,
  theme,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#fbfbfb]/90 dark:bg-[#18181b]/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors duration-200">
      <div className="max-w-[660px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: Brand mark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectView('timeline')}
            className="text-left group cursor-pointer focus:outline-none"
            aria-label="Oğulr Home"
          >
            <span className="font-medium text-lg tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-[#c0392b] dark:group-hover:text-[#e05345] transition-colors duration-150">
              Oğulr
            </span>
          </button>
          {postCount !== undefined && postCount > 0 && (
            <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 hidden sm:inline-block">
              {postCount} {postCount === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>

        {/* Right: Minimal Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2 text-[13px] tracking-tight">
          <button
            id="nav-timeline"
            onClick={() => onSelectView('timeline')}
            className={`px-2.5 py-1.5 rounded-md transition-colors duration-150 cursor-pointer ${
              currentView === 'timeline'
                ? 'text-neutral-900 dark:text-neutral-100 font-medium'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            Timeline
          </button>

          <button
            id="nav-devlog"
            onClick={() => onSelectView('devlog')}
            className={`px-2.5 py-1.5 rounded-md transition-colors duration-150 cursor-pointer ${
              currentView === 'devlog'
                ? 'text-neutral-900 dark:text-neutral-100 font-medium'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            Dev Log
          </button>

          <button
            id="nav-search"
            onClick={() => onSelectView('search')}
            className={`px-2.5 py-1.5 rounded-md transition-colors duration-150 cursor-pointer ${
              currentView === 'search'
                ? 'text-neutral-900 dark:text-neutral-100 font-medium'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            Search
          </button>

          <button
            id="nav-archive"
            onClick={() => onSelectView('archive')}
            className={`px-2.5 py-1.5 rounded-md transition-colors duration-150 cursor-pointer ${
              currentView === 'archive'
                ? 'text-neutral-900 dark:text-neutral-100 font-medium'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            Archive
          </button>

          <button
            id="nav-random"
            onClick={onTriggerRandom}
            title="Random historical thought"
            className="px-2.5 py-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors duration-150 cursor-pointer"
          >
            Random
          </button>

          {/* Theme Toggle Button: Light / Dark Mode Icon */}
          <button
            id="nav-theme-toggle"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
            className="ml-1 sm:ml-2 p-1.5 rounded-md text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors flex items-center justify-center cursor-pointer"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-neutral-300 hover:text-amber-300 transition-colors" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-500 hover:text-neutral-900 transition-colors" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
