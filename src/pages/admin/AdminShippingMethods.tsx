import { useState } from 'react';
import { Plus, Pencil, Trash2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useShippingMethods,
  useCreateShippingMethod,
  useUpdateShippingMethod,
  useDeleteShippingMethod,
  ShippingMethod,
} from '@/hooks/useShippingMethods';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

export default function AdminShippingMethods() {
  const { formatCurrency } = useSiteSettings();
  const { data: methods = [], isLoading } = useShippingMethods(false);
  const createMethod = useCreateShippingMethod();
  const updateMethod = useUpdateShippingMethod();
  const deleteMethod = useDeleteShippingMethod();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_rate: 0,
    estimated_days: '',
    is_active: true,
    sort_order: 0,
  });

  const openCreateDialog = () => {
    setEditingMethod(null);
    setFormData({
      name: '',
      description: '',
      base_rate: 0,
      estimated_days: '',
      is_active: true,
      sort_order: methods.length,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (method: ShippingMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      description: method.description || '',
      base_rate: method.base_rate,
      estimated_days: method.estimated_days || '',
      is_active: method.is_active,
      sort_order: method.sort_order,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingMethod) {
      await updateMethod.mutateAsync({ id: editingMethod.id, ...formData });
    } else {
      await createMethod.mutateAsync(formData);
    }

    setIsDialogOpen(false);
  };

  const handleToggleActive = async (method: ShippingMethod) => {
    await updateMethod.mutateAsync({ id: method.id, is_active: !method.is_active });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMethod.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shipping Methods</h1>
          <p className="text-muted-foreground">Manage delivery options for checkout</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Method
        </Button>
      </div>

      {methods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No shipping methods</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first shipping method to offer delivery options.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Method
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {methods.map((method) => (
            <Card key={method.id} className={!method.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{method.name}</CardTitle>
                    {method.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {method.description}
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={method.is_active}
                    onCheckedChange={() => handleToggleActive(method)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Rate:</span>
                    <span className="font-semibold">{formatCurrency(method.base_rate)}</span>
                  </div>
                  {method.estimated_days && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. Delivery:</span>
                      <span>{method.estimated_days}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(method)}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(method.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? 'Edit Shipping Method' : 'Add Shipping Method'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Express Delivery"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this shipping option"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base_rate">Base Rate *</Label>
                <Input
                  id="base_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.base_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, base_rate: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="estimated_days">Estimated Days</Label>
                <Input
                  id="estimated_days"
                  value={formData.estimated_days}
                  onChange={(e) => setFormData({ ...formData, estimated_days: e.target.value })}
                  placeholder="e.g., 3-5 days"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMethod.isPending || updateMethod.isPending}>
                {editingMethod ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shipping Method?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the shipping method.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
