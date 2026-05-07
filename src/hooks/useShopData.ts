import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  category_id: string | null;
  category?: Category;
  stock: number;
  sku: string;
  short_description: string | null;
  description: string | null;
  images: string[];
  is_new: boolean;
  is_best_seller: boolean;
  is_featured: boolean;
  is_variable: boolean;
  created_at: string;
  updated_at: string;
  has_variants?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export interface SliderSlide {
  id: string;
  image: string;
  heading: string;
  text: string;
  cta_text: string;
  cta_link: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  is_approved: boolean;
  created_at: string;
}

// Products
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*), product_variants(count)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        product_variants: undefined,
        has_variants: p.is_variable && (p.product_variants?.[0]?.count || 0) > 0,
      })) as (Product & { category: Category | null })[];
    },
  });
};

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      return data as (Product & { category: Category | null }) | null;
    },
    enabled: !!slug,
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*), product_variants(count)')
        .eq('is_featured', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        product_variants: undefined,
        has_variants: p.is_variable && (p.product_variants?.[0]?.count || 0) > 0,
      })) as (Product & { category: Category | null })[];
    },
  });
};

export const useBestSellers = () => {
  return useQuery({
    queryKey: ['products', 'bestsellers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*), product_variants(count)')
        .eq('is_best_seller', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        product_variants: undefined,
        has_variants: p.is_variable && (p.product_variants?.[0]?.count || 0) > 0,
      })) as (Product & { category: Category | null })[];
    },
  });
};

export const useNewArrivals = () => {
  return useQuery({
    queryKey: ['products', 'new'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*), product_variants(count)')
        .eq('is_new', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        product_variants: undefined,
        has_variants: p.is_variable && (p.product_variants?.[0]?.count || 0) > 0,
      })) as (Product & { category: Category | null })[];
    },
  });
};

export const useProductsByCategory = (categorySlug: string) => {
  return useQuery({
    queryKey: ['products', 'category', categorySlug],
    queryFn: async () => {
      const { data: category, error: catError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .maybeSingle();
      
      if (catError) throw catError;
      if (!category) return [];

      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*), product_variants(count)')
        .eq('category_id', category.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        product_variants: undefined,
        has_variants: p.is_variable && (p.product_variants?.[0]?.count || 0) > 0,
      })) as (Product & { category: Category | null })[];
    },
    enabled: !!categorySlug,
  });
};

export const useRelatedProducts = (product: Product | null, limit = 4) => {
  return useQuery({
    queryKey: ['products', 'related', product?.id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*), product_variants(count)')
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .limit(limit);
      
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        product_variants: undefined,
        has_variants: p.is_variable && (p.product_variants?.[0]?.count || 0) > 0,
      })) as (Product & { category: Category | null })[];
    },
    enabled: !!product,
  });
};

// Categories
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Category[];
    },
  });
};

export const useCategory = (slug: string) => {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      return data as Category | null;
    },
    enabled: !!slug,
  });
};

// Slider
export const useSliderSlides = (activeOnly = true) => {
  return useQuery({
    queryKey: ['slider_slides', activeOnly],
    queryFn: async () => {
      let query = supabase.from('slider_slides').select('*').order('sort_order');
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as SliderSlide[];
    },
  });
};

// Reviews
export const useReviews = (approvedOnly = true) => {
  return useQuery({
    queryKey: ['reviews', approvedOnly],
    queryFn: async () => {
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (approvedOnly) {
        query = query.eq('is_approved', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Review[];
    },
  });
};

// Mutations
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created');
    },
    onError: (error) => {
      toast.error('Failed to create product: ' + error.message);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated');
    },
    onError: (error) => {
      toast.error('Failed to update product: ' + error.message);
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete product: ' + error.message);
    },
  });
};

// Category mutations
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'product_count'>) => {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created');
    },
    onError: (error) => {
      toast.error('Failed to create category: ' + error.message);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...category }: Partial<Category> & { id: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated');
    },
    onError: (error) => {
      toast.error('Failed to update category: ' + error.message);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete category: ' + error.message);
    },
  });
};

// Slider mutations
export const useCreateSlide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (slide: Omit<SliderSlide, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('slider_slides')
        .insert(slide)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slider_slides'] });
      toast.success('Slide created');
    },
    onError: (error) => {
      toast.error('Failed to create slide: ' + error.message);
    },
  });
};

export const useUpdateSlide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...slide }: Partial<SliderSlide> & { id: string }) => {
      const { data, error } = await supabase
        .from('slider_slides')
        .update(slide)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slider_slides'] });
      toast.success('Slide updated');
    },
    onError: (error) => {
      toast.error('Failed to update slide: ' + error.message);
    },
  });
};

export const useDeleteSlide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('slider_slides').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slider_slides'] });
      toast.success('Slide deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete slide: ' + error.message);
    },
  });
};
