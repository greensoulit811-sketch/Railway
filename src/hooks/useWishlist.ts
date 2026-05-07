import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const WISHLIST_KEY = 'wishlist_session_id';

function getSessionId(): string {
  let sessionId = localStorage.getItem(WISHLIST_KEY);
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(WISHLIST_KEY, sessionId);
  }
  return sessionId;
}

export interface WishlistItem {
  id: string;
  product_id: string;
  user_id: string | null;
  session_id: string | null;
  created_at: string;
}

async function fetchWishlist(userId: string | null, sessionId: string): Promise<WishlistItem[]> {
  let query = (supabase as any).from('wishlists').select('*');
  
  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    query = query.eq('session_id', sessionId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export const useWishlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sessionId = getSessionId();

  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey: ['wishlist', user?.id || sessionId],
    queryFn: () => fetchWishlist(user?.id || null, sessionId),
  });

  const productIds = wishlistItems.map(item => item.product_id);

  const addToWishlist = useMutation({
    mutationFn: async (productId: string) => {
      const insertData = user 
        ? { product_id: productId, user_id: user.id }
        : { product_id: productId, session_id: sessionId };

      const { data, error } = await (supabase as any)
        .from('wishlists')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      return data as WishlistItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Added to wishlist');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.info('Already in wishlist');
      } else {
        toast.error('Failed to add to wishlist');
      }
    },
  });

  const removeFromWishlist = useMutation({
    mutationFn: async (productId: string) => {
      let query = (supabase as any).from('wishlists').delete().eq('product_id', productId);
      
      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', sessionId);
      }
      
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Removed from wishlist');
    },
    onError: () => {
      toast.error('Failed to remove from wishlist');
    },
  });

  const isInWishlist = useCallback((productId: string) => {
    return productIds.includes(productId);
  }, [productIds]);

  const toggleWishlist = useCallback((productId: string) => {
    if (isInWishlist(productId)) {
      removeFromWishlist.mutate(productId);
    } else {
      addToWishlist.mutate(productId);
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist]);

  return {
    wishlistItems,
    productIds,
    isLoading,
    isInWishlist,
    toggleWishlist,
    addToWishlist: addToWishlist.mutate,
    removeFromWishlist: removeFromWishlist.mutate,
  };
};
