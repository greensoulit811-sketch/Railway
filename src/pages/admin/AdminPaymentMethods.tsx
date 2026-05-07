import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CreditCard, Loader2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  PaymentMethod,
} from '@/hooks/usePaymentMethods';

const emptyForm = {
  name: '',
  code: '',
  description: '',
  instructions: '',
  is_enabled: true,
  sort_order: 0,
  allow_partial_delivery_payment: false,
  partial_type: 'delivery_charge' as string,
  fixed_partial_amount: null as number | null,
  require_transaction_id: false,
};

export default function AdminPaymentMethods() {
  const { formatCurrency } = useSiteSettings();
  const { data: methods = [], isLoading } = usePaymentMethods(false);
  const createMethod = useCreatePaymentMethod();
  const updateMethod = useUpdatePaymentMethod();
  const deleteMethod = useDeletePaymentMethod();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sort_order: methods.length });
    setDialogOpen(true);
  };

  const openEdit = (m: PaymentMethod) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      code: m.code,
      description: m.description || '',
      instructions: m.instructions || '',
      is_enabled: m.is_enabled,
      sort_order: m.sort_order,
      allow_partial_delivery_payment: m.allow_partial_delivery_payment,
      partial_type: m.partial_type || 'delivery_charge',
      fixed_partial_amount: m.fixed_partial_amount,
      require_transaction_id: m.require_transaction_id,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required');
      return;
    }

    const payload: any = {
      name: form.name.trim(),
      code: form.code.trim().toLowerCase(),
      description: form.description.trim() || null,
      instructions: form.instructions.trim() || null,
      is_enabled: form.is_enabled,
      sort_order: form.sort_order,
      allow_partial_delivery_payment: form.allow_partial_delivery_payment,
      partial_type: form.allow_partial_delivery_payment ? form.partial_type : null,
      fixed_partial_amount: form.partial_type === 'fixed_amount' && form.allow_partial_delivery_payment
        ? form.fixed_partial_amount
        : null,
      require_transaction_id: form.require_transaction_id,
    };

    if (editingId) {
      updateMethod.mutate({ id: editingId, ...payload }, {
        onSuccess: () => setDialogOpen(false),
      });
    } else {
      createMethod.mutate(payload, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const handleToggleEnabled = (m: PaymentMethod) => {
    updateMethod.mutate({ id: m.id, is_enabled: !m.is_enabled });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Payment Methods</h1>
        <Button onClick={openCreate} className="btn-accent gap-2">
          <Plus className="h-4 w-4" />
          Add Method
        </Button>
      </div>

      {/* Methods List */}
      {methods.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No payment methods yet. Add your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <div
              key={m.id}
              className="bg-card rounded-xl border border-border p-4 flex items-center gap-4"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{m.name}</h3>
                  <Badge variant="outline" className="text-xs">{m.code}</Badge>
                  {m.allow_partial_delivery_payment && (
                    <Badge variant="secondary" className="text-xs">
                      Partial: {m.partial_type === 'delivery_charge' ? 'Delivery charge' : formatCurrency(m.fixed_partial_amount || 0)}
                    </Badge>
                  )}
                  {m.require_transaction_id && (
                    <Badge variant="secondary" className="text-xs">Trx ID required</Badge>
                  )}
                </div>
                {m.description && (
                  <p className="text-sm text-muted-foreground">{m.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={m.is_enabled}
                  onCheckedChange={() => handleToggleEnabled(m)}
                />
                <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm('Delete this payment method?')) {
                      deleteMethod.mutate(m.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Payment Method' : 'Add Payment Method'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., bKash"
                  required
                />
              </div>
              <div>
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g., bkash"
                  required
                  disabled={!!editingId}
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short description shown to customer"
              />
            </div>

            <div>
              <Label>Instructions</Label>
              <Textarea
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="Instructions for customer (e.g., send money to 01XXXXXXXXX)"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Enabled</Label>
              <Switch
                checked={form.is_enabled}
                onCheckedChange={(v) => setForm({ ...form, is_enabled: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Require Transaction ID</Label>
              <Switch
                checked={form.require_transaction_id}
                onCheckedChange={(v) => setForm({ ...form, require_transaction_id: v })}
              />
            </div>

            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>

            {/* Partial Payment Section */}
            <div className="border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Partial Delivery Payment</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Customer pays advance amount, rest on delivery
                  </p>
                </div>
                <Switch
                  checked={form.allow_partial_delivery_payment}
                  onCheckedChange={(v) => setForm({ ...form, allow_partial_delivery_payment: v })}
                />
              </div>

              {form.allow_partial_delivery_payment && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div>
                    <Label>Partial Type</Label>
                    <Select
                      value={form.partial_type}
                      onValueChange={(v) => setForm({ ...form, partial_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delivery_charge">Delivery Charge Only</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {form.partial_type === 'fixed_amount' && (
                    <div>
                      <Label>Fixed Advance Amount</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.fixed_partial_amount ?? ''}
                        onChange={(e) =>
                          setForm({ ...form, fixed_partial_amount: e.target.value ? parseFloat(e.target.value) : null })
                        }
                        placeholder="Enter fixed amount"
                      />
                    </div>
                  )}

                  <div className="bg-secondary/50 rounded-lg p-3 text-sm">
                    <p className="font-medium mb-1">Preview:</p>
                    {form.partial_type === 'delivery_charge' ? (
                      <p className="text-muted-foreground">
                        Customer pays <strong>delivery charge</strong> in advance, remaining on delivery.
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        Customer pays <strong>{formatCurrency(form.fixed_partial_amount || 0)}</strong> in advance, remaining on delivery.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full btn-accent"
              disabled={createMethod.isPending || updateMethod.isPending}
            >
              {(createMethod.isPending || updateMethod.isPending) ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
              ) : editingId ? 'Update Method' : 'Create Method'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
