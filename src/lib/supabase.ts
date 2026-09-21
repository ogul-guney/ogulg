import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Post, isDevLogPost } from '../types.ts';

// Read credentials from Vite environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Initial curated historical thoughts if starting fresh in offline preview
const DEFAULT_HISTORICAL_POSTS: Post[] = [
  {
    id: 'p-dev-001',
    content: "PostgreSQL full-text search indexi entegre edildi. Websearch sözdizimiyle çok kelimeli arşiv aramaları artık milisaniyeler içinde sonuç veriyor.",
    created_at: new Date('2026-09-21T11:30:00').toISOString(),
    updated_at: new Date('2026-09-21T11:30:00').toISOString(),
    is_archived: false,
    post_type: 'devlog',
  },
  {
    id: 'p-001',
    content: "DSOTM'u tekrar dinlemeye başladığımdan beri albümün prodüksiyonuna sözlerden daha fazla takılmaya başladım.",
    created_at: new Date('2026-09-21T22:41:00').toISOString(),
    updated_at: new Date('2026-09-21T22:41:00').toISOString(),
    is_archived: false,
    post_type: 'thought',
  },
  {
    id: 'p-002',
    content: "Bugün okuldan dönerken aynı şarkıyı üç kere üst üste dinledim.",
    created_at: new Date('2026-09-21T19:12:00').toISOString(),
    updated_at: new Date('2026-09-21T19:12:00').toISOString(),
    is_archived: false,
    post_type: 'thought',
  },
  {
    id: 'p-dev-002',
    content: "Tüm arayüzde Apple / Jony Ive minimalist tipografi hiyerarşisi uygulandı. Kart gölgeleri ve süslemeler kaldırılıp içerik arayüzün kendisi haline getirildi.",
    created_at: new Date('2026-09-19T16:45:00').toISOString(),
    updated_at: new Date('2026-09-19T16:45:00').toISOString(),
    is_archived: false,
    post_type: 'devlog',
  },
  {
    id: 'p-003',
    content: "Bir tasarımın bittiğini artık eklenecek bir şey kalmadığında değil, çıkarılacak hiçbir şey kalmadığında anlıyorsun.",
    created_at: new Date('2026-09-18T14:20:00').toISOString(),
    updated_at: new Date('2026-09-18T14:20:00').toISOString(),
    is_archived: false,
    post_type: 'thought',
  },
  {
    id: 'p-004',
    content: "Yağmurdan sonra sokakta kalan toprak kokusunun adı varmış: petrikor. Bazı kelimeler hissin kendisinden daha şiirsel.",
    created_at: new Date('2025-09-21T11:05:00').toISOString(), // On this day: 21 Sep 2025
    updated_at: new Date('2025-09-21T11:05:00').toISOString(),
    is_archived: false,
    post_type: 'thought',
  },
  {
    id: 'p-005',
    content: "Eski notları okurken insanın geçmişteki kendine hem acıması hem de onun cesaretini kıskanması çok garip bir duygu.",
    created_at: new Date('2024-09-21T21:15:00').toISOString(), // On this day: 21 Sep 2024
    updated_at: new Date('2024-09-21T21:15:00').toISOString(),
    is_archived: false,
    post_type: 'thought',
  },
  {
    id: 'p-006',
    content: "Sessiz bir odada klavye sesi dışında hiçbir şeyin olmaması kadar zihni toparlayan az an var.",
    created_at: new Date('2025-05-14T23:50:00').toISOString(),
    updated_at: new Date('2025-05-14T23:50:00').toISOString(),
    is_archived: false,
    post_type: 'thought',
  },
  {
    id: 'p-007',
    content: "Düşünceler uçup gidiyor, ancak birkaç satırla yakalanan anlar yıllar sonra bir hazineye dönüşüyor.",
    created_at: new Date('2024-11-03T16:42:00').toISOString(),
    updated_at: new Date('2024-11-03T16:42:00').toISOString(),
    is_archived: false,
    post_type: 'thought',
  },
];

// Offline fallback memory/storage to ensure zero-crash preview until user configures Supabase
const LOCAL_STORAGE_KEY = 'ogulr_offline_archive';
function getLocalFallbackPosts(): Post[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse local archive', e);
  }
  return DEFAULT_HISTORICAL_POSTS;
}

function saveLocalFallbackPosts(posts: Post[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error('Failed to save to local archive', e);
  }
}

/**
 * Fetch paginated posts (30-50 per batch)
 */
export async function fetchPosts(
  page: number = 0,
  pageSize: number = 35
): Promise<{ posts: Post[]; hasMore: boolean; totalCount: number }> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.warn('Supabase fetch error, fallback to local', error);
        throw error;
      }

      const total = count ?? data?.length ?? 0;
      return {
        posts: (data as Post[]) || [],
        hasMore: (data?.length || 0) === pageSize && to + 1 < total,
        totalCount: total,
      };
    } catch (err) {
      console.warn('Using local fallback due to Supabase error:', err);
    }
  }

  // Local fallback
  const all = getLocalFallbackPosts().filter((p) => !p.is_archived);
  all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const sliced = all.slice(from, to + 1);

  return {
    posts: sliced,
    hasMore: to + 1 < all.length,
    totalCount: all.length,
  };
}

/**
 * Create a new post (thought or devlog)
 */
export async function createPost(
  content: string,
  user?: User | null,
  postType: 'thought' | 'devlog' = 'thought'
): Promise<Post> {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Post content cannot be empty');

  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      const payload: Partial<Post> = {
        content: trimmed,
        created_at: now,
        updated_at: now,
        is_archived: false,
        post_type: postType,
      };
      if (user?.id) {
        payload.user_id = user.id;
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([payload])
        .select()
        .single();

      if (error) {
        // If post_type column doesn't exist on remote table yet, retry with tag prefix
        if (postType === 'devlog') {
          const fallbackPayload = {
            ...payload,
            content: `[devlog] ${trimmed}`,
          };
          delete (fallbackPayload as any).post_type;
          const retry = await supabase.from('posts').insert([fallbackPayload]).select().single();
          if (!retry.error && retry.data) {
            return { ...(retry.data as Post), post_type: 'devlog' };
          }
        }
        throw error;
      }
      return data as Post;
    } catch (err) {
      console.warn('Supabase insert failed, using fallback:', err);
    }
  }

  // Local fallback
  const newPost: Post = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}`,
    user_id: user?.id,
    content: trimmed,
    created_at: now,
    updated_at: now,
    is_archived: false,
    post_type: postType,
  };

  const current = getLocalFallbackPosts();
  saveLocalFallbackPosts([newPost, ...current]);
  return newPost;
}

/**
 * Update an existing post
 */
export async function updatePost(id: string, content: string): Promise<Post> {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Post content cannot be empty');

  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({ content: trimmed, updated_at: now })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Post;
    } catch (err) {
      console.warn('Supabase update failed, using fallback:', err);
    }
  }

  // Local fallback
  const current = getLocalFallbackPosts();
  const index = current.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Post not found');

  const updated: Post = {
    ...current[index],
    content: trimmed,
    updated_at: now,
  };
  current[index] = updated;
  saveLocalFallbackPosts(current);
  return updated;
}

/**
 * Delete a post
 */
export async function deletePost(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Supabase delete failed, using fallback:', err);
    }
  }

  const current = getLocalFallbackPosts();
  const filtered = current.filter((p) => p.id !== id);
  saveLocalFallbackPosts(filtered);
}

/**
 * Search posts using PostgreSQL full-text search
 */
export async function searchPosts(query: string, year?: number | null): Promise<Post[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  if (isSupabaseConfigured && supabase) {
    try {
      // First try PostgreSQL full-text search index
      let request = supabase
        .from('posts')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      // Apply PostgreSQL text search
      try {
        request = request.textSearch('content', cleanQuery, {
          type: 'websearch',
          config: 'english',
        });
      } catch {
        // Fallback to ilike if textSearch index isn't created yet
        request = request.ilike('content', `%${cleanQuery}%`);
      }

      const { data, error } = await request;

      if (!error && data) {
        let results = (data as Post[]).filter((p) => !isDevLogPost(p));
        if (year) {
          results = results.filter((p) => new Date(p.created_at).getFullYear() === year);
        }
        return results;
      }
    } catch (err) {
      console.warn('Supabase search failed, fallback to local search:', err);
    }
  }

  // Local search fallback (only regular thoughts)
  const qLower = cleanQuery.toLowerCase();
  const all = getLocalFallbackPosts().filter((p) => !p.is_archived && !isDevLogPost(p));
  return all.filter((p) => {
    const matchesQuery = p.content.toLowerCase().includes(qLower);
    const matchesYear = year ? new Date(p.created_at).getFullYear() === year : true;
    return matchesQuery && matchesYear;
  });
}

/**
 * Fetch all posts for archive statistics (year & month grouping)
 */
export async function fetchAllPostsForArchive(): Promise<Post[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Post[];
      }
    } catch (err) {
      console.warn('Archive fetch error:', err);
    }
  }

  return getLocalFallbackPosts().filter((p) => !p.is_archived);
}

/**
 * Fetch a single random historical post
 */
export async function fetchRandomPost(): Promise<Post | null> {
  const all = (await fetchAllPostsForArchive()).filter((p) => !isDevLogPost(p));
  if (all.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * all.length);
  return all[randomIndex] || null;
}
