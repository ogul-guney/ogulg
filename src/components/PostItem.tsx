import { useState, useRef, useEffect } from 'react';
import { Post, isDevLogPost, cleanPostDisplayContent } from '../types.ts';
import { formatExactDateTime, formatRelativeTime } from '../lib/dateUtils.ts';
import { FormattedText } from './FormattedText.tsx';

interface PostItemProps {
  post: Post;
  onUpdate: (id: string, newContent: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  highlightKeyword?: string;
  hideDevLogBadge?: boolean;
}

export function PostItem({ post, onUpdate, onDelete, highlightKeyword, hideDevLogBadge }: PostItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const exactTime = formatExactDateTime(post.created_at);
  const relativeTime = formatRelativeTime(post.created_at);
  const displayContent = cleanPostDisplayContent(post.content);

  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      editTextareaRef.current.style.height = 'auto';
      editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setIsSaving(true);
    const success = await onUpdate(post.id, editContent.trim());
    setIsSaving(false);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    await onDelete(post.id);
  };

  // Render post content with markdown formatting (**bold**, _italic_) and search keyword highlight
  const renderContent = (text: string) => {
    return (
      <p className="text-[16px] sm:text-[17px] text-neutral-900 dark:text-neutral-100 leading-relaxed font-normal whitespace-pre-wrap">
        <FormattedText content={text} highlightKeyword={highlightKeyword} />
      </p>
    );
  };

  return (
    <article
      id={`post-${post.id}`}
      className="group py-7 border-b border-neutral-200 dark:border-neutral-800 last:border-b-0 transition-opacity duration-150"
    >
      {/* Archival metadata: Exact timestamp & subtle contextual controls */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500 font-mono tracking-tight text-[11px] sm:text-[12px]">
          <time dateTime={post.created_at}>{exactTime}</time>
          {relativeTime && (
            <>
              <span className="text-neutral-300 dark:text-neutral-700">·</span>
              <span className="text-neutral-400 dark:text-neutral-500 font-sans text-[11px]">{relativeTime}</span>
            </>
          )}
          {post.updated_at !== post.created_at && (
            <span className="text-neutral-400 dark:text-neutral-600 text-[10px] uppercase font-mono tracking-wider ml-1">
              (edited)
            </span>
          )}
          {!hideDevLogBadge && isDevLogPost(post) && (
            <span className="text-[10px] font-mono tracking-tight text-[#c0392b] dark:text-[#e05345] bg-[#c0392b]/8 dark:bg-[#e05345]/15 px-1.5 py-0.5 rounded ml-1">
              dev log
            </span>
          )}
        </div>

        {/* Small contextual menu for Edit / Delete - subtle, non-intrusive */}
        {!isEditing && !isConfirmingDelete && (
          <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 flex items-center gap-3 text-xs">
            <button
              onClick={() => {
                setEditContent(post.content);
                setIsEditing(true);
              }}
              className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
              aria-label="Edit post"
            >
              Edit
            </button>
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="text-neutral-400 dark:text-neutral-500 hover:text-[#c0392b] dark:hover:text-[#e05345] transition-colors cursor-pointer"
              aria-label="Delete post"
            >
              Delete
            </button>
          </div>
        )}

        {/* Inline delete confirmation */}
        {isConfirmingDelete && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400 dark:text-neutral-500 text-[11px]">Delete entry?</span>
            <button
              onClick={handleDelete}
              className="text-[#c0392b] dark:text-[#e05345] font-medium hover:underline text-[12px] cursor-pointer"
            >
              Confirm
            </button>
            <button
              onClick={() => setIsConfirmingDelete(false)}
              className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-[12px] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Main post text or inline editor */}
      {isEditing ? (
        <div className="mt-2">
          <textarea
            ref={editTextareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full bg-neutral-50/70 dark:bg-[#202024] p-3 rounded-md text-neutral-900 dark:text-neutral-100 text-[16px] leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 border border-neutral-200 dark:border-neutral-800"
          />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
              {editContent.length} karakter
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving || !editContent.trim()}
                className="px-3.5 py-1 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium hover:bg-[#c0392b] dark:hover:bg-[#e05345] dark:hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        renderContent(displayContent)
      )}
    </article>
  );
}
