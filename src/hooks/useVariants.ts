import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  sku: string;
  price_adjustment: number;
  variant_price: number | null;
  variant_sale_price: number | null;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

async function fetchVariants(productId: string): Promise<ProductVariant[]> {
  const { data, error } = await (supabase as any)
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('created_at');
  
  if (error) throw error;
  return data || [];
}

export const useProductVariants = (productId: string) => {
  return useQuery({
    queryKey: ['product_variants', productId],
    queryFn: () => fetchVariants(productId),
    enabled: !!productId,
  });
};

export const useCreateVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (variant: Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any)
        .from('product_variants')
        .insert(variant)
        .select()
        .single();
      
      if (error) throw error;
      return data as ProductVariant;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product_variants', variables.product_id] });
      toast.success('Variant created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create variant: ' + error.message);
    },
  });
};

export const useUpdateVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...variant }: Partial<ProductVariant> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('product_variants')
        .update(variant)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as ProductVariant;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product_variants', data.product_id] });
      toast.success('Variant updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update variant: ' + error.message);
    },
  });
};

export const useDeleteVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await (supabase as any).from('product_variants').delete().eq('id', id);
      if (error) throw error;
      return productId;
    },
    onSuccess: (productId) => {
      queryClient.invalidateQueries({ queryKey: ['product_variants', productId] });
      toast.success('Variant deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete variant: ' + error.message);
    },
  });
};
