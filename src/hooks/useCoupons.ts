import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed' | 'free_shipping';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

async function fetchCoupons(): Promise<Coupon[]> {
  const { data, error } = await (supabase as any)
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

async function fetchCouponByCode(code: string): Promise<Coupon | null> {
  const { data, error } = await (supabase as any)
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export const useCoupons = () => {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: fetchCoupons,
  });
};

export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: async ({ code, subtotal }: { code: string; subtotal: number }) => {
      const coupon = await fetchCouponByCode(code);
      if (!coupon) throw new Error('Invalid coupon code');
      
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        throw new Error('This coupon has expired');
      }
      
      if (new Date(coupon.starts_at) > new Date()) {
        throw new Error('This coupon is not yet active');
      }
      
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        throw new Error('This coupon has reached its usage limit');
      }
      
      if (subtotal < coupon.min_order_amount) {
        throw new Error(`Minimum order amount is ৳${coupon.min_order_amount}`);
      }
      
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (subtotal * coupon.discount_value) / 100;
      } else if (coupon.discount_type === 'fixed') {
        discountAmount = coupon.discount_value;
      }
      
      return { coupon, discountAmount };
    },
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (coupon: Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'used_count'>) => {
      const insertData = { ...coupon, code: coupon.code.toUpperCase(), used_count: 0 };
      const { data, error } = await (supabase as any)
        .from('coupons')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      return data as Coupon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create coupon: ' + error.message);
    },
  });
};

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...coupon }: Partial<Coupon> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('coupons')
        .update(coupon)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Coupon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update coupon: ' + error.message);
    },
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete coupon: ' + error.message);
    },
  });
};

export const useIncrementCouponUsage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (couponId: string) => {
      const { data: coupon } = await (supabase as any)
        .from('coupons')
        .select('used_count')
        .eq('id', couponId)
        .single();
      
      if (coupon) {
        await (supabase as any)
          .from('coupons')
          .update({ used_count: coupon.used_count + 1 })
          .eq('id', couponId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
};
