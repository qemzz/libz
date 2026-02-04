import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Book, Category } from '@/lib/supabase-types';

export function useBooks(searchQuery?: string, categoryId?: string) {
  return useQuery({
    queryKey: ['books', searchQuery, categoryId],
    queryFn: async () => {
      let query = supabase
        .from('books')
        .select('*, category:categories(*)');

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,isbn.ilike.%${searchQuery}%`);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (Book & { category: Category | null })[];
    },
  });
}

export function useBook(id: string) {
  return useQuery({
    queryKey: ['book', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*, category:categories(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Book & { category: Category | null };
    },
    enabled: !!id,
  });
}

export function useNewArrivals() {
  return useQuery({
    queryKey: ['books', 'new-arrivals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*, category:categories(*)')
        .eq('is_new_arrival', true)
        .order('created_at', { ascending: false })
        .limit(8);
      
      if (error) throw error;
      return data as (Book & { category: Category | null })[];
    },
  });
}

export function usePopularBooks() {
  return useQuery({
    queryKey: ['books', 'popular'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*, category:categories(*)')
        .order('times_borrowed', { ascending: false })
        .limit(8);
      
      if (error) throw error;
      return data as (Book & { category: Category | null })[];
    },
  });
}

export function useFeaturedBooks() {
  return useQuery({
    queryKey: ['books', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*, category:categories(*)')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (error) throw error;
      return data as (Book & { category: Category | null })[];
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Category[];
    },
  });
}
