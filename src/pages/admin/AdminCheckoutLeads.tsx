import { useState } from 'react';
import { format } from 'date-fns';
import {
  Search,
  Filter,
  Eye,
  Phone,
  CheckCircle,
  XCircle,
  Trash2,
  ShoppingCart,
  User,
  MapPin,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCheckoutLeads,
  useUpdateLeadStatus,
  useDeleteLead,
  CheckoutLead,
} from '@/hooks/useCheckoutLeads';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  converted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  invalid: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminCheckoutLeads() {
  const { formatCurrency } = useSiteSettings();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<CheckoutLead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: leads = [], isLoading } = useCheckoutLeads({
    status: statusFilter,
    search: search.trim() || undefined,
  });

  const updateStatus = useUpdateLeadStatus();
  const deleteLead = useDeleteLead();

  const handleStatusChange = async (id: string, status: string) => {
    await updateStatus.mutateAsync({ id, status });
    if (selectedLead?.id === id) {
      setSelectedLead({ ...selectedLead, status: status as CheckoutLead['status'] });
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteLead.mutateAsync(deleteId);
      setDeleteId(null);
      if (selectedLead?.id === deleteId) {
        setSelectedLead(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Checkout Leads</h1>
        <p className="text-muted-foreground">
          Users who started checkout but didn't complete their order
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by phone, name, or lead #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="invalid">Invalid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['new', 'contacted', 'converted', 'invalid'].map((status) => {
          const count = leads.filter((l) => l.status === status).length;
          return (
            <Card key={status} className="cursor-pointer hover:border-accent transition-colors"
              onClick={() => setStatusFilter(status)}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">{status}</span>
                  <Badge className={statusColors[status]}>{count}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      {leads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No leads found</h3>
            <p className="text-muted-foreground text-center">
              Leads will appear here when users start but don't complete checkout.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-secondary/30"
                    onClick={() => setSelectedLead(lead)}>
                    <TableCell className="font-medium">{lead.lead_no}</TableCell>
                    <TableCell>{lead.customer_name || '-'}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.items.length} items</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(lead.total)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[lead.status]}>{lead.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(lead.created_at), 'MMM d, h:mm a')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLead(lead);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Lead Details Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span>{selectedLead.lead_no}</span>
                  <Badge className={statusColors[selectedLead.status]}>
                    {selectedLead.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Customer Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{selectedLead.customer_name || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{selectedLead.phone}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{selectedLead.email || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">City:</span>
                      <p className="font-medium">{selectedLead.city || '-'}</p>
                    </div>
                    {selectedLead.address && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Address:</span>
                        <p className="font-medium">{selectedLead.address}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Cart Items */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Cart Snapshot ({selectedLead.items.length} items)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedLead.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(item.unit_price)} × {item.quantity}
                            </p>
                          </div>
                          <span className="font-medium">{formatCurrency(item.line_total)}</span>
                        </div>
                      ))}
                      <div className="pt-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span>{formatCurrency(selectedLead.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping:</span>
                          <span>{formatCurrency(selectedLead.shipping_fee)}</span>
                        </div>
                        <div className="flex justify-between font-medium text-base pt-2 border-t">
                          <span>Total:</span>
                          <span>{formatCurrency(selectedLead.total)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Meta Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Activity & Source
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <p>{format(new Date(selectedLead.created_at), 'PPp')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Activity:</span>
                      <p>{format(new Date(selectedLead.last_activity_at), 'PPp')}</p>
                    </div>
                    {(selectedLead.utm_source || selectedLead.utm_medium || selectedLead.utm_campaign) && (
                      <>
                        {selectedLead.utm_source && (
                          <div>
                            <span className="text-muted-foreground">UTM Source:</span>
                            <p>{selectedLead.utm_source}</p>
                          </div>
                        )}
                        {selectedLead.utm_medium && (
                          <div>
                            <span className="text-muted-foreground">UTM Medium:</span>
                            <p>{selectedLead.utm_medium}</p>
                          </div>
                        )}
                        {selectedLead.utm_campaign && (
                          <div>
                            <span className="text-muted-foreground">UTM Campaign:</span>
                            <p>{selectedLead.utm_campaign}</p>
                          </div>
                        )}
                      </>
                    )}
                    {selectedLead.converted_order_id && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Converted Order:</span>
                        <p className="flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          {selectedLead.converted_order_id}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {selectedLead.status !== 'contacted' && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(selectedLead.id, 'contacted')}
                      disabled={updateStatus.isPending}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Mark Contacted
                    </Button>
                  )}
                  {selectedLead.status !== 'converted' && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(selectedLead.id, 'converted')}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Converted
                    </Button>
                  )}
                  {selectedLead.status !== 'invalid' && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(selectedLead.id, 'invalid')}
                      disabled={updateStatus.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Mark Invalid
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(selectedLead.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead record.
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
