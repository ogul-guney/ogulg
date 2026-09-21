import { useEffect } from 'react';
import { Post } from '../types.ts';
import { formatExactDateTime, formatRelativeTime } from '../lib/dateUtils.ts';
import { FormattedText } from './FormattedText.tsx';

interface RandomPostModalProps {
  post: Post | null;
  onClose: () => void;
  onNextRandom: () => void;
}

export function RandomPostModal({ post, onClose, onNextRandom }: RandomPostModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ' && !e.target) {
        // Spacebar to fetch another
        e.preventDefault();
        onNextRandom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNextRandom]);

  if (!post) return null;

  const exactTime = formatExactDateTime(post.created_at);
  const relativeTime = formatRelativeTime(post.created_at);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/30 dark:bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] bg-[#fcfcfb] dark:bg-[#1f1f23] border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-6 sm:p-8 relative shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200/50 dark:border-neutral-800/80 text-xs">
          <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500 font-mono text-[11px]">
            <span>{exactTime}</span>
            {relativeTime && (
              <>
                <span className="text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-neutral-400 dark:text-neutral-500 font-sans">{relativeTime}</span>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 text-xs font-mono p-1 cursor-pointer"
            aria-label="Close random thought modal"
          >
            Esc
          </button>
        </div>

        {/* Content */}
        <div className="py-8">
          <p className="text-[18px] sm:text-[20px] text-neutral-900 dark:text-neutral-100 leading-relaxed font-normal whitespace-pre-wrap">
            <FormattedText content={post.content} />
          </p>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-neutral-200/50 dark:border-neutral-800/80 flex items-center justify-between text-xs">
          <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
            Random historical thought
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onNextRandom}
              className="text-neutral-600 dark:text-neutral-300 hover:text-[#c0392b] dark:hover:text-[#e05345] font-medium transition-colors cursor-pointer text-xs"
            >
              Another thought →
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-md transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
