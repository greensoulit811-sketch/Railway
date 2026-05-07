import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useOrderTracking = (orderNumber: string, phone: string) => {
  return useQuery({
    queryKey: ['order_tracking', orderNumber, phone],
    queryFn: async () => {
      // Clean phone number - remove spaces, dashes, etc.
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
      
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', orderNumber)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Order not found');
      
      // Verify phone matches (last 4 digits or full match)
      const orderPhone = data.customer_phone.replace(/[\s\-\(\)]/g, '');
      const phoneMatches = 
        orderPhone === cleanPhone || 
        orderPhone.endsWith(cleanPhone.slice(-4)) ||
        cleanPhone.endsWith(orderPhone.slice(-4));
      
      if (!phoneMatches) {
        throw new Error('Phone number does not match this order');
      }
      
      return data;
    },
    enabled: !!orderNumber && !!phone && orderNumber.length > 3 && phone.length >= 4,
    retry: false,
  });
};
