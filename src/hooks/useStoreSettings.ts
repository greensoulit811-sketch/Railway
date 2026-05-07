import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StoreSettings {
  store_name: string;
  store_logo: string;
  store_favicon: string;
  store_tagline: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  store_city: string;
  store_postal_code: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  youtube_url: string;
  whatsapp_number: string;
  footer_text: string;
  // About page
  about_hero_title: string;
  about_hero_image: string;
  about_story_title: string;
  about_story_p1: string;
  about_story_p2: string;
  about_value_1_title: string;
  about_value_1_text: string;
  about_value_2_title: string;
  about_value_2_text: string;
  about_value_3_title: string;
  about_value_3_text: string;
  about_value_4_title: string;
  about_value_4_text: string;
  about_stat_1_value: string;
  about_stat_1_label: string;
  about_stat_2_value: string;
  about_stat_2_label: string;
  about_stat_3_value: string;
  about_stat_3_label: string;
  about_stat_4_value: string;
  about_stat_4_label: string;
  // Contact page
  contact_subtitle: string;
  contact_hours: string;
  contact_map_embed: string;
  // WhatsApp order button
  whatsapp_order_enabled: string;
  topbar_text: string;
  topbar_enabled: string;
  // Legal pages
  privacy_title: string;
  privacy_content: string;
  terms_title: string;
  terms_content: string;
}

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  store_name: 'My Store',
  store_logo: '',
  store_favicon: '',
  store_tagline: 'Your one-stop shop',
  store_email: '',
  store_phone: '',
  store_address: '',
  store_city: '',
  store_postal_code: '',
  facebook_url: '',
  instagram_url: '',
  twitter_url: '',
  youtube_url: '',
  whatsapp_number: '',
  footer_text: '',
  about_hero_title: 'About Us',
  about_hero_image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80',
  about_story_title: 'Our Story',
  about_story_p1: 'Founded in 2020, our store began with a simple mission: to bring premium quality products to everyone at fair prices.',
  about_story_p2: 'Today, we serve thousands of happy customers, offering a curated selection of products that combine style, functionality, and value.',
  about_value_1_title: 'Quality First',
  about_value_1_text: 'We never compromise on quality. Every product is carefully vetted.',
  about_value_2_title: 'Customer Focus',
  about_value_2_text: 'Your satisfaction is our priority. We\'re here to help.',
  about_value_3_title: 'Fast Delivery',
  about_value_3_text: 'Quick and reliable shipping to your doorstep.',
  about_value_4_title: 'Secure Shopping',
  about_value_4_text: 'Shop with confidence. Your data is always protected.',
  about_stat_1_value: '5K+',
  about_stat_1_label: 'Happy Customers',
  about_stat_2_value: '500+',
  about_stat_2_label: 'Products',
  about_stat_3_value: '4.9',
  about_stat_3_label: 'Average Rating',
  about_stat_4_value: '24/7',
  about_stat_4_label: 'Support',
  contact_subtitle: 'Have a question or need help? We\'re here for you. Reach out and we\'ll get back to you as soon as possible.',
  contact_hours: 'Sat–Thu: 10am–8pm',
  contact_map_embed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d233668.38703692678!2d90.27923994863282!3d23.780573258035967!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8b087026b81%3A0x8fa563bbdd5904c2!2sDhaka!5e0!3m2!1sen!2sbd!4v1706601234567!5m2!1sen!2sbd',
  whatsapp_order_enabled: 'false',
  topbar_text: 'Free Shipping on Orders Over ৳500!',
  topbar_enabled: 'true',
  privacy_title: 'Privacy Policy',
  privacy_content: '',
  terms_title: 'Terms & Conditions',
  terms_content: '',
};

export const STORE_SETTINGS_QUERY_KEY = ['store-settings'];

export function useStoreSettings() {
  return useQuery({
    queryKey: STORE_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('key, value');

      if (error) throw error;

      const settings: StoreSettings = { ...DEFAULT_STORE_SETTINGS };
      data?.forEach((row) => {
        if (row.key in settings) {
          (settings as any)[row.key] = row.value;
        }
      });

      return settings;
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateStoreSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<StoreSettings>) => {
      const upserts = Object.entries(updates).map(([key, value]) => ({
        key,
        value: value || '',
        updated_at: new Date().toISOString(),
      }));

      for (const upsert of upserts) {
        const { error } = await supabase
          .from('store_settings')
          .upsert(upsert, { onConflict: 'key' });

        if (error) throw error;
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORE_SETTINGS_QUERY_KEY });
      queryClient.refetchQueries({ queryKey: STORE_SETTINGS_QUERY_KEY });
    },
  });
}

export function useRefreshStoreSettings() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: STORE_SETTINGS_QUERY_KEY });
    queryClient.refetchQueries({ queryKey: STORE_SETTINGS_QUERY_KEY });
  };
}