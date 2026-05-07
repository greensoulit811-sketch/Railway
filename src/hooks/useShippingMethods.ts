import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ShippingMethod {
  id: string;
  name: string;
  description: string | null;
  base_rate: number;
  estimated_days: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

async function fetchShippingMethods(activeOnly: boolean): Promise<ShippingMethod[]> {
  let query = (supabase as any)
    .from('shipping_methods')
    .select('*')
    .order('sort_order');
  
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export const useShippingMethods = (activeOnly = true) => {
  return useQuery({
    queryKey: ['shipping_methods', activeOnly],
    queryFn: () => fetchShippingMethods(activeOnly),
  });
};

export const useCreateShippingMethod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (method: Omit<ShippingMethod, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any)
        .from('shipping_methods')
        .insert(method)
        .select()
        .single();
      
      if (error) throw error;
      return data as ShippingMethod;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping_methods'] });
      toast.success('Shipping method created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create method: ' + error.message);
    },
  });
};

export const useUpdateShippingMethod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...method }: Partial<ShippingMethod> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('shipping_methods')
        .update(method)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as ShippingMethod;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping_methods'] });
      toast.success('Shipping method updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update method: ' + error.message);
    },
  });
};

export const useDeleteShippingMethod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('shipping_methods').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping_methods'] });
      toast.success('Shipping method deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete method: ' + error.message);
    },
  });
};
