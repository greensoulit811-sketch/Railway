import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type StaffRole = 'admin' | 'manager' | 'order_handler' | 'customer';

export interface UserRole {
  id: string;
  user_id: string;
  role: StaffRole;
  created_at: string;
}

export interface StaffMember {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: StaffRole;
  created_at: string;
}

export const useUserRole = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user_role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserRole | null;
    },
    enabled: !!user,
  });
};

export const useStaffMembers = () => {
  return useQuery({
    queryKey: ['staff_members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          created_at
        `)
        .in('role', ['admin', 'manager', 'order_handler'])
        .order('created_at');
      
      if (error) throw error;
      
      // Get profiles separately
      const userIds = data.map((item: any) => item.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);
      
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      
      return data.map((item: any) => {
        const profile = profileMap.get(item.user_id);
        return {
          id: item.id,
          user_id: item.user_id,
          role: item.role as StaffRole,
          created_at: item.created_at,
          email: profile?.email || null,
          full_name: profile?.full_name || null,
        };
      }) as StaffMember[];
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: StaffRole }) => {
      const { data, error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff_members'] });
      queryClient.invalidateQueries({ queryKey: ['user_role'] });
      toast.success('Role updated');
    },
    onError: (error) => {
      toast.error('Failed to update role: ' + error.message);
    },
  });
};

export const useCanManageOrders = () => {
  const { data: role } = useUserRole();
  return role && ['admin', 'manager', 'order_handler'].includes(role.role);
};

export const useCanManageProducts = () => {
  const { data: role } = useUserRole();
  return role && ['admin', 'manager'].includes(role.role);
};

export const useIsAdmin = () => {
  const { data: role } = useUserRole();
  return role?.role === 'admin';
};
