import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CourierSettings {
  id: string;
  provider: string;
  enabled: boolean;
  api_base_url: string | null;
  api_key: string | null;
  api_secret: string | null;
  merchant_id: string | null;
  pickup_address: string | null;
  pickup_phone: string | null;
  default_weight: number;
  cod_enabled: boolean;
  show_tracking_to_customer: boolean;
  created_at: string;
  updated_at: string;
}

export const useCourierSettings = (provider: string) => {
  return useQuery({
    queryKey: ['courier_settings', provider],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courier_settings')
        .select('*')
        .eq('provider', provider)
        .maybeSingle();
      
      if (error) throw error;
      return data as CourierSettings | null;
    },
  });
};

export const useSaveCourierSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Partial<CourierSettings> & { provider: string }) => {
      const { data: existing } = await supabase
        .from('courier_settings')
        .select('id')
        .eq('provider', settings.provider)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('courier_settings')
          .update(settings)
          .eq('provider', settings.provider)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('courier_settings')
          .insert(settings)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['courier_settings', variables.provider] });
      toast.success('Courier settings saved');
    },
    onError: (error) => {
      toast.error('Failed to save settings: ' + error.message);
    },
  });
};

export const useTestCourierConnection = () => {
  return useMutation({
    mutationFn: async (provider: string) => {
      // Get settings first
      const { data: settings, error: fetchError } = await supabase
        .from('courier_settings')
        .select('*')
        .eq('provider', provider)
        .maybeSingle();

      if (fetchError || !settings) throw new Error('Settings not found. Please save first.');
      if (!settings.api_key || !settings.api_secret || !settings.api_base_url) {
        throw new Error('API configuration is incomplete');
      }

      const response = await fetch(`${settings.api_base_url}/get_balance`, {
        headers: {
          'Api-Key': settings.api_key,
          'Secret-Key': settings.api_secret,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (response.ok && data.status === 200) {
        return { success: true, balance: data.current_balance };
      }
      throw new Error(data.message || 'Connection failed');
    },
  });
};

export const useCreateCourierParcel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: {
      order_id: string;
      recipient_name: string;
      recipient_phone: string;
      recipient_address: string;
      recipient_city: string;
      cod_amount: number;
      invoice: string;
      note?: string;
    }) => {
      // Get settings first
      const { data: settings } = await supabase
        .from('courier_settings')
        .select('*')
        .eq('provider', 'steadfast')
        .maybeSingle();

      if (!settings?.enabled) throw new Error('Steadfast is not enabled');
      if (!settings.api_key || !settings.api_secret || !settings.api_base_url) {
        throw new Error('API configuration is incomplete');
      }

      const parcelPayload = {
        invoice: payload.invoice,
        recipient_name: payload.recipient_name,
        recipient_phone: payload.recipient_phone,
        recipient_address: payload.recipient_address,
        cod_amount: payload.cod_amount,
        note: payload.note || '',
      };

      const response = await fetch(`${settings.api_base_url}/create_order`, {
        method: 'POST',
        headers: {
          'Api-Key': settings.api_key,
          'Secret-Key': settings.api_secret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parcelPayload),
      });

      const data = await response.json();
      
      // Log interaction
      await supabase.from('courier_logs').insert({
        order_id: payload.order_id,
        provider: 'steadfast',
        action: 'create_parcel',
        status: (response.ok && data.status === 200) ? 'success' : 'failed',
        message: data.message || (typeof data.errors === 'object' ? JSON.stringify(data.errors) : data.errors) || '',
        request_payload: parcelPayload,
        response_payload: data,
      });

      if (response.ok && data.status === 200) {
        // Update order
        await supabase.from('orders').update({
          courier_provider: 'steadfast',
          courier_status: 'created',
          courier_tracking_id: data.consignment?.tracking_code,
          courier_consignment_id: data.consignment?.consignment_id?.toString(),
          courier_reference: payload.invoice,
          courier_payload: parcelPayload,
          courier_response: data,
          courier_created_at: new Date().toISOString(),
          courier_updated_at: new Date().toISOString(),
        }).eq('id', payload.order_id);

        return { 
          success: true, 
          tracking_code: data.consignment?.tracking_code,
          consignment_id: data.consignment?.consignment_id,
        };
      }
      
      // Handle complex error objects
      let errorMessage = data.message || 'Failed to create parcel';
      if (data.errors && typeof data.errors === 'object') {
        const errorDetails = Object.entries(data.errors)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('; ');
        errorMessage = `${errorMessage} (${errorDetails})`;
      } else if (data.errors) {
        errorMessage = `${errorMessage} (${data.errors})`;
      }
      
      throw new Error(errorMessage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Parcel created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create parcel: ' + error.message);
    },
  });
};

export const useTrackCourierStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: { consignment_id: string; order_id: string }) => {
      const { data: settings } = await supabase
        .from('courier_settings')
        .select('*')
        .eq('provider', 'steadfast')
        .maybeSingle();

      if (!settings?.enabled) throw new Error('Steadfast is not enabled');
      if (!settings.api_key || !settings.api_secret || !settings.api_base_url) {
        throw new Error('API configuration is incomplete');
      }

      const response = await fetch(`${settings.api_base_url}/status_by_cid/${payload.consignment_id}`, {
        headers: {
          'Api-Key': settings.api_key,
          'Secret-Key': settings.api_secret,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      await supabase.from('courier_logs').insert({
        order_id: payload.order_id,
        provider: 'steadfast',
        action: 'track_status',
        status: response.ok ? 'success' : 'failed',
        message: data.delivery_status || '',
        request_payload: { consignment_id: payload.consignment_id },
        response_payload: data,
      });

      if (response.ok && data.status === 200) {
        let courierStatus = 'created';
        const ds = data.delivery_status?.toLowerCase();
        if (ds === 'delivered') courierStatus = 'delivered';
        else if (ds === 'cancelled') courierStatus = 'cancelled';
        else if (ds === 'pending' || ds === 'in_review') courierStatus = 'pending';
        else if (ds) courierStatus = 'in_transit';

        const updateData: Record<string, any> = { 
          courier_status: courierStatus, 
          courier_updated_at: new Date().toISOString() 
        };
        
        if (courierStatus === 'delivered') updateData.status = 'delivered';
        else if (courierStatus === 'in_transit') updateData.status = 'shipped';
        
        await supabase.from('orders').update(updateData).eq('id', payload.order_id);

        return { 
          success: true, 
          courier_status: courierStatus, 
          delivery_status: data.delivery_status 
        };
      }
      
      throw new Error(data.message || 'Failed to track status');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Tracking status updated');
    },
    onError: (error) => {
      toast.error('Failed to track status: ' + error.message);
    },
  });
};
