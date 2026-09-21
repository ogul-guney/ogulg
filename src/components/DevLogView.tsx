import { useState, useRef, useEffect } from 'react';
import { Post, isDevLogPost } from '../types.ts';
import { PostItem } from './PostItem.tsx';

interface DevLogViewProps {
  posts: Post[];
  onPostDevLog: (content: string) => Promise<boolean>;
  onUpdatePost: (id: string, newContent: string) => Promise<boolean>;
  onDeletePost: (id: string) => Promise<boolean>;
  isSubmitting?: boolean;
}

export function DevLogView({
  posts,
  onPostDevLog,
  onUpdatePost,
  onDeletePost,
  isSubmitting = false,
}: DevLogViewProps) {
  const [content, setContent] = useState('');
  const [justLogged, setJustLogged] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter dev logs, sorted newest first
  const devLogPosts = posts
    .filter(isDevLogPost)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Auto-resize textarea as text grows without jump
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const baseHeight = 72;
      textareaRef.current.style.height = `${Math.max(baseHeight, textareaRef.current.scrollHeight)}px`;
    }
  }, [content]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    try {
      const ok = await onPostDevLog(content);
      if (ok) {
        setContent('');
        setJustLogged(true);
        setTimeout(() => setJustLogged(false), 2500);
        if (textareaRef.current) {
          textareaRef.current.style.height = '72px';
        }
      }
    } catch (err) {
      console.error('Failed to log entry', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="py-8">
      {/* Dev Log Title */}
      <div className="pb-6">
        <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-neutral-900 dark:text-neutral-100">
          Dev Log
        </h2>
      </div>

      {/* Log Input */}
      <form onSubmit={handleSubmit} className="space-y-4 pb-8 border-b border-neutral-200 dark:border-neutral-800">
        <textarea
          ref={textareaRef}
          id="devlog-composer-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Log code commits, architectural thoughts, or technical changes…"
          rows={2}
          className="w-full bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-[17px] sm:text-[18px] leading-relaxed resize-none focus:outline-none transition-colors duration-150"
          autoFocus
        />

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 select-none">
              {content.length} karakter
            </span>
            {justLogged && (
              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                ✓ Logged
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono hidden sm:inline-block">
              ⌘ + Enter to log
            </span>

            <button
              id="devlog-submit-button"
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="px-4 py-1.5 rounded-full text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-[#c0392b] dark:hover:bg-[#e05345] dark:hover:text-white transition-all duration-150 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              {isSubmitting ? 'Logging…' : 'Log'}
            </button>
          </div>
        </div>
      </form>

      {/* Dev Log Entries - only visible here */}
      <div className="divide-y-0">
        {devLogPosts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-neutral-400 dark:text-neutral-500 text-xs font-mono">
              No dev logs recorded yet.
            </p>
          </div>
        ) : (
          devLogPosts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              onUpdate={onUpdatePost}
              onDelete={onDeletePost}
              hideDevLogBadge={true}
            />
          ))
        )}
      </div>
    </div>
  );
}
