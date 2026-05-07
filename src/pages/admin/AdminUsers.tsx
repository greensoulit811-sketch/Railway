import { useState } from 'react';
import { Users, Plus, Shield, ShieldCheck, ShieldAlert, UserCheck, UserX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface StaffUser {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email: string | null;
  full_name: string | null;
  is_active: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  order_handler: 'Order Handler',
};

const ROLE_ICONS: Record<string, typeof Shield> = {
  admin: ShieldAlert,
  manager: ShieldCheck,
  order_handler: Shield,
};

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', role: 'order_handler' });

  const fetchUsers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users?action=list`,
      {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return (data.users || []) as StaffUser[];
  };

  const { data: usersList = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: fetchUsers,
  });

  const createMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users?action=create`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('User created successfully');
      setCreateOpen(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'order_handler' });
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users?action=update-role`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id, role }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ user_id, is_active }: { user_id: string; is_active: boolean }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users?action=toggle-active`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id, is_active }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('User status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = usersList.filter((u) => {
    const matchesSearch = !search || 
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password) {
      toast.error('Email and password are required');
      return;
    }
    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    createMutation.mutate(newUser);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="btn-accent gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Staff User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label>Password *</Label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin — Full access</SelectItem>
                    <SelectItem value="manager">Manager — Products, Orders, Categories</SelectItem>
                    <SelectItem value="order_handler">Order Handler — Orders only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full btn-accent" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                ) : (
                  'Create User'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Access Info */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <h3 className="font-semibold mb-2 text-sm">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Admin</p>
              <p className="text-muted-foreground">Full access: products, orders, settings, users</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Manager</p>
              <p className="text-muted-foreground">Products, categories, orders, slider</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Order Handler</p>
              <p className="text-muted-foreground">Orders only (view + update status)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="order_handler">Order Handler</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      {isLoadingUsers ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No staff users found</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => {
                  const RoleIcon = ROLE_ICONS[u.role] || Shield;
                  const isSelf = u.user_id === currentUser?.id;
                  return (
                    <tr key={u.user_id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{u.full_name || '—'}</p>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Select
                          value={u.role}
                          onValueChange={(role) => updateRoleMutation.mutate({ user_id: u.user_id, role })}
                          disabled={isSelf}
                        >
                          <SelectTrigger className="w-[160px]">
                            <div className="flex items-center gap-2">
                              <RoleIcon className="h-4 w-4" />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="order_handler">Order Handler</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4">
                        {u.is_active ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                            <UserCheck className="h-3 w-3 mr-1" /> Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">
                            <UserX className="h-3 w-3 mr-1" /> Disabled
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isSelf || toggleActiveMutation.isPending}
                          onClick={() => toggleActiveMutation.mutate({ user_id: u.user_id, is_active: !u.is_active })}
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
