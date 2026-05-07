import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address: string;
  shipping_city: string;
  shipping_method: string;
  shipping_cost: number;
  payment_method: string;
  subtotal: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  fb_purchase_sent?: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  // Payment tracking fields
  payment_method_id: string | null;
  payment_method_name: string | null;
  payment_status: string;
  paid_amount: number;
  due_amount: number;
  transaction_id: string | null;
  partial_rule_snapshot: Record<string, any> | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  variant_id?: string | null;
  variant_info?: Record<string, string | null | undefined> | null;
  line_total?: number | null;
  created_at: string;
}

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (Order & { order_items: OrderItem[] })[];
    },
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as (Order & { order_items: OrderItem[] }) | null;
    },
    enabled: !!id,
  });
};

export const useOrderByNumber = (orderNumber: string) => {
  return useQuery({
    queryKey: ['order-by-number', orderNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', orderNumber)
        .maybeSingle();
      
      if (error) throw error;
      return data as (Order & { order_items: OrderItem[] }) | null;
    },
    enabled: !!orderNumber && orderNumber !== 'N/A',
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      order,
      items,
    }: {
      order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'order_items'>;
      items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[];
    }) => {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single();
      
      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        ...item,
        order_id: orderData.id,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;

      return orderData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      toast.error('Failed to create order: ' + error.message);
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Order['status'] }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated');
    },
    onError: (error) => {
      toast.error('Failed to update order: ' + error.message);
    },
  });
};

// Store settings
export interface StoreSetting {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export const useStoreSettings = () => {
  return useQuery({
    queryKey: ['store_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*');
      
      if (error) throw error;
      
      // Convert to key-value map
      const settings: Record<string, string> = {};
      (data as StoreSetting[]).forEach((s) => {
        settings[s.key] = s.value;
      });
      return settings;
    },
  });
};

export const useUpdateStoreSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Record<string, string>) => {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));
      
      // Upsert each setting
      for (const update of updates) {
        const { error } = await supabase
          .from('store_settings')
          .update({ value: update.value })
          .eq('key', update.key);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store_settings'] });
      toast.success('Settings saved');
    },
    onError: (error) => {
      toast.error('Failed to save settings: ' + error.message);
    },
  });
};
