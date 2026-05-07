import { useState } from 'react';
import { Plus, Edit, Trash2, MoreHorizontal, Truck } from 'lucide-react';
import { useShippingZones, useCreateShippingZone, useUpdateShippingZone, useDeleteShippingZone, ShippingZone } from '@/hooks/useShippingZones';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Switch } from '@/components/ui/switch';

export default function AdminShipping() {
  const { formatCurrency } = useSiteSettings();
  const { data: zones = [], isLoading } = useShippingZones(false);
  const createZone = useCreateShippingZone();
  const updateZone = useUpdateShippingZone();
  const deleteZone = useDeleteShippingZone();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    cities: '',
    rate: '',
    delivery_days: '',
    sort_order: '0',
    is_active: true,
  });

  const handleEdit = (zone: ShippingZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      cities: zone.cities.join(', '),
      rate: zone.rate.toString(),
      delivery_days: zone.delivery_days || '',
      sort_order: zone.sort_order.toString(),
      is_active: zone.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteZone.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const zoneData = {
      name: formData.name,
      cities: formData.cities.split(',').map(c => c.trim()).filter(Boolean),
      rate: parseFloat(formData.rate) || 0,
      delivery_days: formData.delivery_days || null,
      sort_order: parseInt(formData.sort_order) || 0,
      is_active: formData.is_active,
    };

    try {
      if (editingZone) {
        await updateZone.mutateAsync({ id: editingZone.id, ...zoneData });
      } else {
        await createZone.mutateAsync(zoneData);
      }
      setIsDialogOpen(false);
      setEditingZone(null);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      cities: '',
      rate: '',
      delivery_days: '',
      sort_order: '0',
      is_active: true,
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Shipping Zones</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-accent" onClick={() => { setEditingZone(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Zone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingZone ? 'Edit Shipping Zone' : 'Create Shipping Zone'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">Zone Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-shop"
                  placeholder="Inside Dhaka"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cities (comma separated) *</label>
                <textarea
                  value={formData.cities}
                  onChange={(e) => setFormData({ ...formData, cities: e.target.value })}
                  className="input-shop min-h-[80px]"
                  placeholder="Dhaka, Gazipur, Narayanganj"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rate (৳) *</label>
                  <input
                    type="number"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    className="input-shop"
                    placeholder="60"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Delivery Time</label>
                  <input
                    type="text"
                    value={formData.delivery_days}
                    onChange={(e) => setFormData({ ...formData, delivery_days: e.target.value })}
                    className="input-shop"
                    placeholder="2-3 days"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sort Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  className="input-shop"
                  placeholder="0"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Active</label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="btn-accent flex-1" disabled={createZone.isPending || updateZone.isPending}>
                  {editingZone ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto" />
          </div>
        ) : zones.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No shipping zones. Create your first zone!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Zone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Cities</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-accent" />
                        <span className="font-medium">{zone.name}</span>
                      </div>
                      {zone.delivery_days && (
                        <p className="text-xs text-muted-foreground mt-1">{zone.delivery_days}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {zone.cities.slice(0, 3).join(', ')}
                      {zone.cities.length > 3 && ` +${zone.cities.length - 3} more`}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {formatCurrency(zone.rate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        zone.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {zone.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(zone)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteId(zone.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shipping Zone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
