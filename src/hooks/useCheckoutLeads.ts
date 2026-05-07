import { useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LeadItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface CheckoutLead {
  id: string;
  lead_no: string;
  lead_token: string;
  status: 'new' | 'contacted' | 'converted' | 'invalid';
  source: string;
  customer_name: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  items: LeadItem[];
  subtotal: number;
  shipping_fee: number;
  total: number;
  currency_code: string;
  page_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  converted_order_id: string | null;
}

interface LeadData {
  customer_name?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  items: LeadItem[];
  subtotal: number;
  shipping_fee: number;
  total: number;
  currency_code: string;
}

const LEAD_TOKEN_KEY = 'checkout_lead_token';
const LEAD_ID_KEY = 'checkout_lead_id';
const LAST_SAVE_KEY = 'checkout_lead_last_save';
const MIN_SAVE_INTERVAL = 2000; // 2 seconds between saves
const MAX_SAVES_PER_MINUTE = 10;

// Rate limiting tracker
let saveCount = 0;
let saveCountResetTime = Date.now();

function getLeadToken(): string {
  let token = localStorage.getItem(LEAD_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(LEAD_TOKEN_KEY, token);
  }
  return token;
}

function getLeadId(): string | null {
  return localStorage.getItem(LEAD_ID_KEY);
}

function setLeadId(id: string): void {
  localStorage.setItem(LEAD_ID_KEY, id);
}

function clearLeadStorage(): void {
  localStorage.removeItem(LEAD_TOKEN_KEY);
  localStorage.removeItem(LEAD_ID_KEY);
  localStorage.removeItem(LAST_SAVE_KEY);
}

function canSave(): boolean {
  // Reset counter every minute
  if (Date.now() - saveCountResetTime > 60000) {
    saveCount = 0;
    saveCountResetTime = Date.now();
  }
  
  // Check rate limit
  if (saveCount >= MAX_SAVES_PER_MINUTE) {
    return false;
  }
  
  // Check minimum interval
  const lastSave = localStorage.getItem(LAST_SAVE_KEY);
  if (lastSave && Date.now() - parseInt(lastSave) < MIN_SAVE_INTERVAL) {
    return false;
  }
  
  return true;
}

function recordSave(): void {
  saveCount++;
  localStorage.setItem(LAST_SAVE_KEY, Date.now().toString());
}

function getUTMParams(): { utm_source?: string; utm_medium?: string; utm_campaign?: string } {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
  };
}

// Hook for saving leads (used in checkout page)
export const useCheckoutLeadCapture = () => {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<LeadData | null>(null);

  const saveLead = useCallback(async (data: LeadData, force = false): Promise<void> => {
    // Phone is required
    if (!data.phone || data.phone.trim().length < 5) {
      return;
    }

    // Rate limiting (skip for force saves like beforeunload)
    if (!force && !canSave()) {
      return;
    }

    try {
      const leadToken = getLeadToken();
      const existingLeadId = getLeadId();
      const utmParams = getUTMParams();

      const leadPayload = {
        lead_token: leadToken,
        customer_name: data.customer_name?.trim() || null,
        phone: data.phone.trim(),
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        country: data.country?.trim() || null,
        notes: data.notes?.trim() || null,
        items: data.items,
        subtotal: data.subtotal,
        shipping_fee: data.shipping_fee,
        total: data.total,
        currency_code: data.currency_code,
        page_url: window.location.href,
        utm_source: utmParams.utm_source || null,
        utm_medium: utmParams.utm_medium || null,
        utm_campaign: utmParams.utm_campaign || null,
        user_agent: navigator.userAgent,
        last_activity_at: new Date().toISOString(),
      };

      if (existingLeadId) {
        // Update existing lead
        await (supabase as any)
          .from('checkout_leads')
          .update(leadPayload)
          .eq('id', existingLeadId)
          .eq('lead_token', leadToken);
      } else {
        // Check for duplicate (same phone within 24h)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: existing } = await (supabase as any)
          .from('checkout_leads')
          .select('id, lead_token')
          .eq('phone', data.phone.trim())
          .gte('created_at', twentyFourHoursAgo)
          .neq('status', 'converted')
          .order('created_at', { ascending: false })
          .limit(1);

        if (existing && existing.length > 0) {
          // Update existing lead instead of creating new
          const existingLead = existing[0];
          setLeadId(existingLead.id);
          localStorage.setItem(LEAD_TOKEN_KEY, existingLead.lead_token);
          
          await (supabase as any)
            .from('checkout_leads')
            .update({ ...leadPayload, lead_token: existingLead.lead_token })
            .eq('id', existingLead.id);
        } else {
          // Create new lead
          const { data: newLead } = await (supabase as any)
            .from('checkout_leads')
            .insert({ ...leadPayload, lead_no: '' }) // trigger will generate lead_no
            .select('id')
            .single();

          if (newLead) {
            setLeadId(newLead.id);
          }
        }
      }

      recordSave();
    } catch (error) {
      // Fail silently - don't block checkout
      console.debug('Lead save failed:', error);
    }
  }, []);

  const debouncedSave = useCallback((data: LeadData) => {
    pendingDataRef.current = data;
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (pendingDataRef.current) {
        saveLead(pendingDataRef.current);
      }
    }, 2500); // 2.5 second debounce
  }, [saveLead]);

  const saveImmediately = useCallback(() => {
    if (pendingDataRef.current) {
      saveLead(pendingDataRef.current, true);
    }
  }, [saveLead]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    debouncedSave,
    saveImmediately,
    clearLeadStorage,
    getLeadId,
  };
};

// Hook to mark lead as converted
export const useConvertLead = () => {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const leadId = getLeadId();
      const leadToken = localStorage.getItem(LEAD_TOKEN_KEY);
      
      if (!leadId || !leadToken) return null;

      await (supabase as any)
        .from('checkout_leads')
        .update({
          status: 'converted',
          converted_order_id: orderId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
        .eq('lead_token', leadToken);

      clearLeadStorage();
      return leadId;
    },
  });
};

// Admin hooks
export const useCheckoutLeads = (filters?: {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  return useQuery({
    queryKey: ['checkout_leads', filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from('checkout_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(
          `phone.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,lead_no.ilike.%${filters.search}%`
        );
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data || []) as CheckoutLead[];
    },
  });
};

export const useNewLeadsCount = () => {
  return useQuery({
    queryKey: ['checkout_leads_count'],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from('checkout_leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useUpdateLeadStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from('checkout_leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkout_leads'] });
      queryClient.invalidateQueries({ queryKey: ['checkout_leads_count'] });
      toast.success('Lead status updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update lead: ' + error.message);
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('checkout_leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkout_leads'] });
      queryClient.invalidateQueries({ queryKey: ['checkout_leads_count'] });
      toast.success('Lead deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete lead: ' + error.message);
    },
  });
};
