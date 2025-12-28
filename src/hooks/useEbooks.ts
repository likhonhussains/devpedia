import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type EbookGenre = 
  | 'fiction' | 'non_fiction' | 'technology' | 'science' | 'self_help' 
  | 'business' | 'biography' | 'history' | 'fantasy' | 'mystery' 
  | 'romance' | 'horror' | 'poetry' | 'education' | 'other';

export type EbookStatus = 'draft' | 'published' | 'archived';

export interface Ebook {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  genre: EbookGenre;
  status: EbookStatus;
  views_count: number;
  likes_count: number;
  reviews_count: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
  author?: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
  chapters_count?: number;
}

export interface EbookChapter {
  id: string;
  ebook_id: string;
  title: string;
  content: string;
  chapter_order: number;
  created_at: string;
  updated_at: string;
}

export interface EbookReview {
  id: string;
  ebook_id: string;
  user_id: string;
  rating: number;
  content: string | null;
  created_at: string;
  author?: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export const GENRE_LABELS: Record<EbookGenre, string> = {
  fiction: 'Fiction',
  non_fiction: 'Non-Fiction',
  technology: 'Technology',
  science: 'Science',
  self_help: 'Self-Help',
  business: 'Business',
  biography: 'Biography',
  history: 'History',
  fantasy: 'Fantasy',
  mystery: 'Mystery',
  romance: 'Romance',
  horror: 'Horror',
  poetry: 'Poetry',
  education: 'Education',
  other: 'Other',
};

export const useEbooks = (genre?: EbookGenre, searchQuery?: string) => {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEbooks = async () => {
    setLoading(true);
    
    let query = supabase
      .from('ebooks')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (genre && genre !== 'other') {
      query = query.eq('genre', genre);
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching ebooks:', error);
      setLoading(false);
      return;
    }

    // Get author profiles
    const userIds = [...new Set(data?.map(e => e.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .in('user_id', userIds);

    // Get chapter counts
    const ebookIds = data?.map(e => e.id) || [];
    const { data: chapters } = await supabase
      .from('ebook_chapters')
      .select('ebook_id')
      .in('ebook_id', ebookIds);

    const chapterCounts = chapters?.reduce((acc, ch) => {
      acc[ch.ebook_id] = (acc[ch.ebook_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const ebooksWithAuthors = data?.map(ebook => ({
      ...ebook,
      author: profiles?.find(p => p.user_id === ebook.user_id),
      chapters_count: chapterCounts[ebook.id] || 0,
    })) || [];

    setEbooks(ebooksWithAuthors);
    setLoading(false);
  };

  useEffect(() => {
    fetchEbooks();
  }, [genre, searchQuery]);

  return { ebooks, loading, refetch: fetchEbooks };
};

export const useEbook = (ebookId: string | undefined) => {
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [chapters, setChapters] = useState<EbookChapter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEbook = async () => {
    if (!ebookId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: ebookData, error } = await supabase
      .from('ebooks')
      .select('*')
      .eq('id', ebookId)
      .maybeSingle();

    if (error || !ebookData) {
      console.error('Error fetching ebook:', error);
      setLoading(false);
      return;
    }

    // Get author profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .eq('user_id', ebookData.user_id)
      .maybeSingle();

    // Get chapters
    const { data: chaptersData } = await supabase
      .from('ebook_chapters')
      .select('*')
      .eq('ebook_id', ebookId)
      .order('chapter_order', { ascending: true });

    setEbook({
      ...ebookData,
      author: profile || undefined,
      chapters_count: chaptersData?.length || 0,
    });
    setChapters(chaptersData || []);
    setLoading(false);

    // Increment view count
    await supabase.rpc('increment_ebook_views', { p_ebook_id: ebookId });
  };

  useEffect(() => {
    fetchEbook();
  }, [ebookId]);

  return { ebook, chapters, loading, refetch: fetchEbook };
};

export const useEbookReviews = (ebookId: string | undefined) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<EbookReview[]>([]);
  const [userReview, setUserReview] = useState<EbookReview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    if (!ebookId) return;

    const { data, error } = await supabase
      .from('ebook_reviews')
      .select('*')
      .eq('ebook_id', ebookId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return;
    }

    const userIds = [...new Set(data?.map(r => r.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .in('user_id', userIds);

    const reviewsWithAuthors = data?.map(review => ({
      ...review,
      author: profiles?.find(p => p.user_id === review.user_id),
    })) || [];

    setReviews(reviewsWithAuthors);
    setUserReview(reviewsWithAuthors.find(r => r.user_id === user?.id) || null);
    setLoading(false);
  };

  const addReview = async (rating: number, content: string) => {
    if (!user || !ebookId) return false;

    const { error } = await supabase
      .from('ebook_reviews')
      .insert({
        ebook_id: ebookId,
        user_id: user.id,
        rating,
        content,
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Could not add review',
        variant: 'destructive',
      });
      return false;
    }

    await fetchReviews();
    return true;
  };

  const deleteReview = async (reviewId: string) => {
    const { error } = await supabase
      .from('ebook_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Could not delete review',
        variant: 'destructive',
      });
      return false;
    }

    await fetchReviews();
    return true;
  };

  useEffect(() => {
    fetchReviews();
  }, [ebookId, user]);

  return { reviews, userReview, loading, addReview, deleteReview, refetch: fetchReviews };
};

export const useEbookInteractions = (ebookId: string | undefined) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkInteractions = async () => {
    if (!user || !ebookId) {
      setLoading(false);
      return;
    }

    const [{ data: like }, { data: bookmark }] = await Promise.all([
      supabase
        .from('ebook_likes')
        .select('id')
        .eq('ebook_id', ebookId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('ebook_bookmarks')
        .select('id')
        .eq('ebook_id', ebookId)
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    setIsLiked(!!like);
    setIsBookmarked(!!bookmark);
    setLoading(false);
  };

  const toggleLike = async () => {
    if (!user || !ebookId) return;

    if (isLiked) {
      await supabase
        .from('ebook_likes')
        .delete()
        .eq('ebook_id', ebookId)
        .eq('user_id', user.id);
      await supabase.rpc('decrement_ebook_likes', { p_ebook_id: ebookId });
    } else {
      await supabase
        .from('ebook_likes')
        .insert({ ebook_id: ebookId, user_id: user.id });
      await supabase.rpc('increment_ebook_likes', { p_ebook_id: ebookId });
    }

    setIsLiked(!isLiked);
  };

  const toggleBookmark = async () => {
    if (!user || !ebookId) return;

    if (isBookmarked) {
      await supabase
        .from('ebook_bookmarks')
        .delete()
        .eq('ebook_id', ebookId)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('ebook_bookmarks')
        .insert({ ebook_id: ebookId, user_id: user.id });
    }

    setIsBookmarked(!isBookmarked);
  };

  useEffect(() => {
    checkInteractions();
  }, [ebookId, user]);

  return { isLiked, isBookmarked, loading, toggleLike, toggleBookmark };
};

export const useMyEbooks = () => {
  const { user } = useAuth();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyEbooks = async () => {
    if (!user) {
      setEbooks([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('ebooks')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching ebooks:', error);
      setLoading(false);
      return;
    }

    // Get chapter counts
    const ebookIds = data?.map(e => e.id) || [];
    const { data: chapters } = await supabase
      .from('ebook_chapters')
      .select('ebook_id')
      .in('ebook_id', ebookIds);

    const chapterCounts = chapters?.reduce((acc, ch) => {
      acc[ch.ebook_id] = (acc[ch.ebook_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    setEbooks(data?.map(e => ({
      ...e,
      chapters_count: chapterCounts[e.id] || 0,
    })) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMyEbooks();
  }, [user]);

  return { ebooks, loading, refetch: fetchMyEbooks };
};

export const useMyBookmarks = () => {
  const { user } = useAuth();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    if (!user) {
      setEbooks([]);
      setLoading(false);
      return;
    }

    const { data: bookmarks } = await supabase
      .from('ebook_bookmarks')
      .select('ebook_id')
      .eq('user_id', user.id);

    if (!bookmarks || bookmarks.length === 0) {
      setEbooks([]);
      setLoading(false);
      return;
    }

    const ebookIds = bookmarks.map(b => b.ebook_id);
    const { data, error } = await supabase
      .from('ebooks')
      .select('*')
      .in('id', ebookIds)
      .eq('status', 'published');

    if (error) {
      console.error('Error fetching bookmarked ebooks:', error);
      setLoading(false);
      return;
    }

    // Get author profiles
    const userIds = [...new Set(data?.map(e => e.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .in('user_id', userIds);

    setEbooks(data?.map(ebook => ({
      ...ebook,
      author: profiles?.find(p => p.user_id === ebook.user_id),
    })) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookmarks();
  }, [user]);

  return { ebooks, loading, refetch: fetchBookmarks };
};
