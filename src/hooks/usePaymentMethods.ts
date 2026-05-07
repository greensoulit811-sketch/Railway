import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  description: string | null;
  instructions: string | null;
  is_enabled: boolean;
  sort_order: number;
  allow_partial_delivery_payment: boolean;
  partial_type: string | null;
  fixed_partial_amount: number | null;
  require_transaction_id: boolean;
  provider_fields: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export const usePaymentMethods = (enabledOnly = true) => {
  return useQuery({
    queryKey: ['payment_methods', enabledOnly],
    queryFn: async () => {
      let query = supabase
        .from('payment_methods')
        .select('*')
        .order('sort_order');
      
      if (enabledOnly) {
        query = query.eq('is_enabled', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PaymentMethod[];
    },
  });
};

export const useCreatePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (method: Partial<PaymentMethod>) => {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert(method as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
      toast.success('Payment method created');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdatePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentMethod> & { id: string }) => {
      const { data, error } = await supabase
        .from('payment_methods')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
      toast.success('Payment method updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
      toast.success('Payment method deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
