export interface Post {
  id: string;
  user_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_archived?: boolean;
  post_type?: 'thought' | 'devlog';
}

export type ViewMode = 'timeline' | 'devlog' | 'search' | 'archive';

export function isDevLogPost(post: Post): boolean {
  return (
    post.post_type === 'devlog' ||
    post.content.startsWith('[devlog]') ||
    post.content.startsWith('#devlog')
  );
}

export function cleanPostDisplayContent(content: string): string {
  if (content.startsWith('[devlog] ')) return content.slice(9);
  if (content.startsWith('[devlog]')) return content.slice(8);
  return content;
}

export interface MonthArchiveCount {
  monthName: string;
  monthIndex: number; // 0-11
  count: number;
}

export interface YearArchiveGroup {
  year: number;
  totalCount: number;
  months: MonthArchiveCount[];
}

export interface SearchFilters {
  query: string;
  year?: number | null;
}
