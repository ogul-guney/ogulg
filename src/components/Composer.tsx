import { useState, useRef, useEffect } from 'react';

interface ComposerProps {
  onPost: (content: string) => Promise<boolean>;
  isSubmitting?: boolean;
}

export function Composer({ onPost, isSubmitting = false }: ComposerProps) {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const characterCount = content.length;
  const canSubmit = content.trim().length > 0 && !isSubmitting;

  // Auto-resize textarea only as text length actually requires it, without expanding on click/focus
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const baseHeight = 72;
      textareaRef.current.style.height = `${Math.max(baseHeight, scrollHeight)}px`;
    }
  }, [content]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setErrorMsg(null);
    try {
      const success = await onPost(content);
      if (success) {
        setContent('');
        if (textareaRef.current) {
          textareaRef.current.style.height = '72px';
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to archive thought');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section className="pt-8 pb-6 border-b border-neutral-200 dark:border-neutral-800">
      <div className="relative">
        <textarea
          ref={textareaRef}
          id="post-composer-textarea"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (errorMsg) setErrorMsg(null);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind?"
          rows={2}
          className="w-full bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-[17px] sm:text-[18px] leading-relaxed resize-none focus:outline-none transition-colors duration-150"
          aria-label="New post content"
        />

        {errorMsg && (
          <p className="text-[13px] text-[#c0392b] dark:text-[#e05345] mt-1 font-mono">{errorMsg}</p>
        )}

        {/* Footer controls: Quiet, Apple-inspired restraint */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span
              id="char-counter"
              className="font-mono text-neutral-400 dark:text-neutral-500 text-[11px] sm:text-xs tracking-tight transition-colors duration-150"
            >
              {characterCount > 0
                ? `${characterCount} karakter`
                : isFocused
                ? '0 karakter'
                : ''}
            </span>

            <span className="hidden sm:inline-block text-[11px] text-neutral-400 dark:text-neutral-500 font-mono tracking-tight">
              ⌘ + Enter
            </span>
          </div>

          <div className="flex items-center gap-2">
            {content.length > 0 && (
              <button
                type="button"
                onClick={() => setContent('')}
                className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 px-2 py-1 text-xs transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}

            <button
              id="submit-post-button"
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-tight transition-all duration-150 ${
                canSubmit
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-[#c0392b] dark:hover:bg-[#e05345] dark:hover:text-white active:scale-[0.98] cursor-pointer'
                  : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Archiving…' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
