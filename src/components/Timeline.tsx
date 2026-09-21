import { Post, isDevLogPost } from '../types.ts';
import { PostItem } from './PostItem.tsx';

interface TimelineProps {
  posts: Post[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onUpdatePost: (id: string, newContent: string) => Promise<boolean>;
  onDeletePost: (id: string) => Promise<boolean>;
}

export function Timeline({
  posts,
  isLoading,
  hasMore,
  onLoadMore,
  onUpdatePost,
  onDeletePost,
}: TimelineProps) {
  // Only regular thoughts in the timeline - dev logs are exclusively in Dev Log view
  const timelinePosts = posts.filter((p) => !isDevLogPost(p));

  if (timelinePosts.length === 0 && !isLoading) {
    return (
      <div className="py-24 text-center">
        <p className="text-neutral-400 dark:text-neutral-500 text-sm font-normal">
          The archive is quiet.
        </p>
        <p className="text-neutral-300 dark:text-neutral-600 text-xs mt-1.5 font-mono">
          Write a short thought above to begin your personal record.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y-0">
      {timelinePosts.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          onUpdate={onUpdatePost}
          onDelete={onDeletePost}
        />
      ))}

      {/* Pagination / Load more */}
      <div className="py-12 flex justify-center">
        {hasMore ? (
          <button
            id="load-more-posts-btn"
            onClick={onLoadMore}
            disabled={isLoading}
            className="px-5 py-2 text-xs font-mono tracking-tight text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 border border-neutral-200/80 dark:border-neutral-800 rounded-full hover:border-neutral-400 dark:hover:border-neutral-600 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Loading older thoughts…' : 'Load older entries'}
          </button>
        ) : timelinePosts.length > 0 ? (
          <div className="text-center">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700 mb-2"></span>
            <p className="text-[12px] font-mono text-neutral-400 dark:text-neutral-500 tracking-wide">
              And then, there was light.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
