import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductReview {
  id: string;
  product_id: string | null;
  name: string;
  rating: number;
  text: string;
  is_approved: boolean;
  verified_purchase: boolean;
  user_id: string | null;
  order_id: string | null;
  created_at: string;
}

async function fetchProductReviews(productId: string, approvedOnly: boolean): Promise<ProductReview[]> {
  let query = supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });
  
  // Filter by product_id if the column exists
  query = (query as any).eq('product_id', productId);
  
  if (approvedOnly) {
    query = query.eq('is_approved', true);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  return ((data || []) as any[]).map(item => ({
    ...item,
    product_id: item.product_id || null,
    verified_purchase: item.verified_purchase || false,
    user_id: item.user_id || null,
    order_id: item.order_id || null,
  }));
}

async function fetchAllReviews(approvedOnly: boolean): Promise<ProductReview[]> {
  let query = supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (approvedOnly) {
    query = query.eq('is_approved', true);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  return ((data || []) as any[]).map(item => ({
    ...item,
    product_id: item.product_id || null,
    verified_purchase: item.verified_purchase || false,
    user_id: item.user_id || null,
    order_id: item.order_id || null,
  }));
}

export const useProductReviews = (productId: string, approvedOnly = true) => {
  return useQuery({
    queryKey: ['product_reviews', productId, approvedOnly],
    queryFn: () => fetchProductReviews(productId, approvedOnly),
    enabled: !!productId,
  });
};

export const useAllReviews = (approvedOnly = false) => {
  return useQuery({
    queryKey: ['all_reviews', approvedOnly],
    queryFn: () => fetchAllReviews(approvedOnly),
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (review: {
      product_id: string;
      name: string;
      rating: number;
      text: string;
      order_id?: string;
      user_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          name: review.name,
          rating: review.rating,
          text: review.text,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_reviews'] });
      toast.success('Review submitted! It will appear after approval.');
    },
    onError: (error: Error) => {
      toast.error('Failed to submit review: ' + error.message);
    },
  });
};

export const useApproveReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update({ is_approved: approved })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_reviews'] });
      queryClient.invalidateQueries({ queryKey: ['all_reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review status updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update review: ' + error.message);
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_reviews'] });
      queryClient.invalidateQueries({ queryKey: ['all_reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete review: ' + error.message);
    },
  });
};
