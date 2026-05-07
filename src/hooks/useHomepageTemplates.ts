import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HomepageTemplate {
  id: string;
  name: string;
  label: string;
  is_active: boolean;
  preview_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface HomepageSection {
  id: string;
  template_id: string;
  section_type: string;
  title:string;
  subtitle: string;
  enabled: boolean;
  sort_order: number;
  layout_style: string;
  product_source: string;
  product_source_value: string;
  settings_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HomepageBanner {
  id: string;
  template_id: string;
  image: string;
  link: string;
  alt_text: string;
  is_active: boolean;
  sort_order: number;
}

export function useHomepageTemplates() {
  return useQuery({
    queryKey: ['homepage-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homepage_templates')
        .select('*')
        .order('created_at');
      if (error) throw error;
      return data as HomepageTemplate[];
    },
  });
}

export function useActiveTemplate() {
  return useQuery({
    queryKey: ['homepage-templates', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homepage_templates')
        .select('*')
        .eq('is_active', true)
        .single();
      if (error) throw error;
      return data as HomepageTemplate;
    },
    staleTime: 1000 * 30,
  });
}

export function useTemplateSections(templateId: string | undefined) {
  return useQuery({
    queryKey: ['homepage-sections', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .eq('template_id', templateId)
        .order('sort_order');
      if (error) throw error;
      return data as HomepageSection[];
    },
    enabled: !!templateId,
  });
}

export function useActiveTemplateSections() {
  const { data: activeTemplate } = useActiveTemplate();
  return useTemplateSections(activeTemplate?.id);
}

export function useSetActiveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      // Deactivate all
      const { error: e1 } = await supabase
        .from('homepage_templates')
        .update({ is_active: false })
        .neq('id', templateId);
      if (e1) throw e1;
      // Activate chosen
      const { error: e2 } = await supabase
        .from('homepage_templates')
        .update({ is_active: true })
        .eq('id', templateId);
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homepage-templates'] });
      toast.success('Homepage template activated!');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (section: Partial<HomepageSection> & { id: string }) => {
      const { id, ...rest } = section;
      const { error } = await supabase
        .from('homepage_sections')
        .update(rest)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homepage-sections'] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useBulkUpdateSections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sections: { id: string; sort_order: number; enabled: boolean }[]) => {
      for (const s of sections) {
        const { error } = await supabase
          .from('homepage_sections')
          .update({ sort_order: s.sort_order, enabled: s.enabled })
          .eq('id', s.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homepage-sections'] });
      toast.success('Sections updated!');
    },
    onError: (e: any) => toast.error(e.message),
  });
}
