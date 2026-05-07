import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ShippingZone {
  id: string;
  name: string;
  cities: string[];
  rate: number;
  delivery_days: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

async function fetchShippingZones(activeOnly: boolean): Promise<ShippingZone[]> {
  let query = (supabase as any)
    .from('shipping_zones')
    .select('*')
    .order('sort_order');
  
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export const useShippingZones = (activeOnly = true) => {
  return useQuery({
    queryKey: ['shipping_zones', activeOnly],
    queryFn: () => fetchShippingZones(activeOnly),
  });
};

export const useShippingRateForCity = (city: string) => {
  const { data: zones = [] } = useShippingZones(true);
  
  const matchingZone = zones.find(zone => 
    zone.cities.some(c => c.toLowerCase() === city.toLowerCase())
  );
  
  const defaultZone = zones.reduce((max, zone) => 
    zone.rate > (max?.rate || 0) ? zone : max, zones[0]
  );
  
  return matchingZone || defaultZone;
};

export const useCreateShippingZone = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (zone: Omit<ShippingZone, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any)
        .from('shipping_zones')
        .insert(zone)
        .select()
        .single();
      
      if (error) throw error;
      return data as ShippingZone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping_zones'] });
      toast.success('Shipping zone created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create zone: ' + error.message);
    },
  });
};

export const useUpdateShippingZone = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...zone }: Partial<ShippingZone> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('shipping_zones')
        .update(zone)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as ShippingZone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping_zones'] });
      toast.success('Shipping zone updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update zone: ' + error.message);
    },
  });
};

export const useDeleteShippingZone = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('shipping_zones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping_zones'] });
      toast.success('Shipping zone deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete zone: ' + error.message);
    },
  });
};
