import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HowToUseCard {
  image: string;
  title: string;
  description: string;
}

export interface LandingPage {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
  hero_title: string;
  hero_subtitle: string | null;
  hero_image: string | null;
  hero_cta_text: string;
  product_ids: string[];
  how_to_use_cards: HowToUseCard[];
  show_reviews: boolean;
  created_at: string;
  updated_at: string;
}

export const useLandingPages = () => {
  return useQuery({
    queryKey: ['landing_pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        how_to_use_cards: (d.how_to_use_cards as any) || [],
      })) as LandingPage[];
    },
  });
};

export const useLandingPage = (slug: string) => {
  return useQuery({
    queryKey: ['landing_page', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        how_to_use_cards: (data.how_to_use_cards as any) || [],
      } as LandingPage;
    },
    enabled: !!slug,
  });
};

export const useCreateLandingPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (page: Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('landing_pages')
        .insert({
          ...page,
          how_to_use_cards: JSON.parse(JSON.stringify(page.how_to_use_cards)),
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landing_pages'] });
      toast.success('Landing page created');
    },
    onError: (e) => toast.error('Failed: ' + e.message),
  });
};

export const useUpdateLandingPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...page }: Partial<LandingPage> & { id: string }) => {
      const payload: any = { ...page };
      if (page.how_to_use_cards) {
        payload.how_to_use_cards = JSON.parse(JSON.stringify(page.how_to_use_cards));
      }
      const { data, error } = await supabase
        .from('landing_pages')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landing_pages'] });
      toast.success('Landing page updated');
    },
    onError: (e) => toast.error('Failed: ' + e.message),
  });
};

export const useDeleteLandingPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('landing_pages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landing_pages'] });
      toast.success('Landing page deleted');
    },
    onError: (e) => toast.error('Failed: ' + e.message),
  });
};
