import { useState, useEffect, useCallback, useMemo } from 'react';
import { Post, ViewMode, isDevLogPost } from './types.ts';
import {
  fetchPosts,
  fetchAllPostsForArchive,
  createPost,
  updatePost,
  deletePost,
  fetchRandomPost,
  isSupabaseConfigured,
  supabase,
} from './lib/supabase.ts';
import { Header } from './components/Header.tsx';
import { Composer } from './components/Composer.tsx';
import { Timeline } from './components/Timeline.tsx';
import { SearchView } from './components/SearchView.tsx';
import { ArchiveView } from './components/ArchiveView.tsx';
import { DevLogView } from './components/DevLogView.tsx';
import { RandomPostModal } from './components/RandomPostModal.tsx';
import { DatabaseSettingsModal } from './components/DatabaseSettingsModal.tsx';
import { User } from '@supabase/supabase-js';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('timeline');
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  // Modals & User state
  const [randomPost, setRandomPost] = useState<Post | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Light / Dark mode state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ogulr_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ogulr_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Listen to Supabase Auth state if configured
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setCurrentUser(session?.user ?? null);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setCurrentUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Initial load of posts
  const loadInitialPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pagedResult, allResult] = await Promise.all([
        fetchPosts(0, 35),
        fetchAllPostsForArchive(),
      ]);

      setPosts(pagedResult.posts);
      setHasMore(pagedResult.hasMore);
      setTotalCount(pagedResult.totalCount);
      setAllPosts(allResult);
      setCurrentPage(0);
    } catch (err) {
      console.error('Failed to load posts', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialPosts();
  }, [loadInitialPosts]);

  // Load more (pagination / infinite scroll)
  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;
    const nextPage = currentPage + 1;
    setIsLoading(true);
    try {
      const result = await fetchPosts(nextPage, 35);
      setPosts((prev) => [...prev, ...result.posts]);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
    } catch (err) {
      console.error('Failed to load more posts', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Post creation
  const handlePost = async (content: string, postType: 'thought' | 'devlog' = 'thought'): Promise<boolean> => {
    setIsPosting(true);
    try {
      const newPost = await createPost(content, currentUser, postType);
      if (postType === 'thought') {
        setPosts((prev) => [newPost, ...prev]);
        setTotalCount((prev) => prev + 1);
      }
      setAllPosts((prev) => [newPost, ...prev]);
      return true;
    } catch (err) {
      console.error('Post failed', err);
      throw err;
    } finally {
      setIsPosting(false);
    }
  };

  // Post update
  const handleUpdatePost = async (id: string, newContent: string): Promise<boolean> => {
    try {
      const updated = await updatePost(id, newContent);
      setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setAllPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return true;
    } catch (err) {
      console.error('Update failed', err);
      return false;
    }
  };

  // Post delete
  const handleDeletePost = async (id: string): Promise<boolean> => {
    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setAllPosts((prev) => prev.filter((p) => p.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      return true;
    } catch (err) {
      console.error('Delete failed', err);
      return false;
    }
  };

  // Random historical thought trigger
  const handleTriggerRandom = async () => {
    try {
      const r = await fetchRandomPost();
      if (r) {
        setRandomPost(r);
      }
    } catch (err) {
      console.error('Random post error', err);
    }
  };

  // Extract available years for filters
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allPosts.forEach((p) => {
      const yr = new Date(p.created_at).getFullYear();
      if (!isNaN(yr)) years.add(yr);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allPosts]);

  return (
    <div className="min-h-screen bg-[#fbfbfb] dark:bg-[#18181b] text-neutral-900 dark:text-[#f4f4f5] font-sans selection:bg-neutral-200/80 dark:selection:bg-neutral-800 antialiased flex flex-col justify-between transition-colors duration-150">
      <div>
        {/* Navigation Header */}
        <Header
          currentView={currentView}
          onSelectView={setCurrentView}
          onTriggerRandom={handleTriggerRandom}
          postCount={totalCount}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Centered Single-Column Layout: 640–700px wide */}
        <main className="max-w-[660px] mx-auto px-4 sm:px-6 w-full">
          {currentView === 'timeline' && (
            <>
              {/* Top Composer */}
              <Composer onPost={handlePost} isSubmitting={isPosting} />

              {/* Timeline list */}
              <Timeline
                posts={posts}
                isLoading={isLoading}
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
                onUpdatePost={handleUpdatePost}
                onDeletePost={handleDeletePost}
              />
            </>
          )}

          {currentView === 'devlog' && (
            <DevLogView
              posts={allPosts}
              onPostDevLog={(content) => handlePost(content, 'devlog')}
              onUpdatePost={handleUpdatePost}
              onDeletePost={handleDeletePost}
              isSubmitting={isPosting}
            />
          )}

          {currentView === 'search' && (
            <SearchView
              onBack={() => setCurrentView('timeline')}
              onUpdatePost={handleUpdatePost}
              onDeletePost={handleDeletePost}
              availableYears={availableYears}
            />
          )}

          {currentView === 'archive' && (
            <ArchiveView
              posts={allPosts.filter((p) => !isDevLogPost(p))}
              onBack={() => setCurrentView('timeline')}
              onUpdatePost={handleUpdatePost}
              onDeletePost={handleDeletePost}
            />
          )}
        </main>
      </div>

      {/* Minimal Footer: ogulguney · Supabase Connected */}
      <footer className="max-w-[660px] mx-auto px-4 sm:px-6 w-full py-8 text-center text-xs text-neutral-400 dark:text-neutral-500 font-mono">
        <div className="flex items-center justify-center gap-3 text-[11px]">
          <span>ogulguney</span>
          <span>·</span>
          <button
            onClick={() => setIsDbModalOpen(true)}
            className="hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
          >
            Supabase Connected
          </button>
        </div>
      </footer>

      {/* Random Historical Post Modal */}
      <RandomPostModal
        post={randomPost}
        onClose={() => setRandomPost(null)}
        onNextRandom={handleTriggerRandom}
      />

      {/* Database / Supabase Setup & Auth Modal */}
      <DatabaseSettingsModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
      />
    </div>
  );
}
