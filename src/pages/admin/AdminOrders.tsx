import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, MoreHorizontal, RefreshCw, FileText, Printer } from 'lucide-react';
import { useOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { PrintModal } from '@/components/admin/PrintModal';


const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

export default function AdminOrders() {
  const { data: orders = [], isLoading, error, refetch } = useOrders();
  const { data: storeSettings } = useStoreSettings();
  const updateStatus = useUpdateOrderStatus();
  const { t, formatCurrency, settings } = useSiteSettings();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [printModal, setPrintModal] = useState<{ open: boolean; type: 'invoice' | 'courier-slip' | 'courier-label'; order: any | null }>({
    open: false,
    type: 'invoice',
    order: null,
  });

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    await updateStatus.mutateAsync({ id: orderId, status: newStatus as any });
    
    // Send Purchase event when status changes to confirmed
    if (newStatus === 'confirmed' && order && !order.fb_purchase_sent) {
      sendPurchaseEvent(order);
    }
  };

  const sendPurchaseEvent = async (order: any) => {
    try {
      const eventId = order.order_number;
      const { data, error } = await supabase.functions.invoke('meta-capi', {
        body: {
          event_name: 'Purchase',
          event_id: eventId,
          custom_data: {
            value: order.total,
            currency: settings.currency_code,
            order_id: order.order_number,
            contents: order.order_items?.map((item: any) => ({
              id: item.product_id,
              quantity: item.quantity,
              item_price: item.price,
            })) || [],
            content_type: 'product',
          },
          user_data: {
            em: order.customer_email || undefined,
            ph: order.customer_phone || undefined,
          },
        },
      });

      if (error) throw error;

      if (data?.success && !data?.skipped) {
        // Mark as sent
        await supabase
          .from('orders')
          .update({ fb_purchase_sent: true })
          .eq('id', order.id);
        refetch();
        toast.success('Purchase event sent to Meta');
      } else if (data?.skipped) {
        toast.info(`Purchase event skipped: ${data.reason}`);
      } else {
        toast.error('Failed to send Purchase event');
      }
    } catch (err: any) {
      toast.error('Failed to send Purchase event: ' + (err.message || 'Unknown error'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-teal-100 text-teal-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return t(`order.status.${status}`);
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive mb-4">Failed to load orders. Check RLS policies.</p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">{t('admin.orders')}</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by order ID, customer, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-shop pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {getStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{t('order.orderNumber')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{t('checkout.phone')}</th>
                  
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{t('cart.total')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.length === 0 ? (
                  <tr>
                   <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      {t('common.noResults')}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{order.order_number}</td>
                      <td className="px-6 py-4">{order.customer_name}</td>
                      <td className="px-6 py-4"><a href={`tel:${order.customer_phone}`} className="text-primary hover:underline">{order.customer_phone}</a></td>
                      <td className="px-6 py-4 font-medium">{formatCurrency(order.total)}</td>
                      <td className="px-6 py-4">
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                        >
                          <SelectTrigger className={`w-32 ${getStatusColor(order.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50">
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {getStatusLabel(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover z-50">
                            <DropdownMenuItem onClick={() => navigate(`/admin/orders/${order.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              {t('common.view')} Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setPrintModal({ open: true, type: 'invoice', order })}>
                              <FileText className="h-4 w-4 mr-2" />
                              Print Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPrintModal({ open: true, type: 'courier-slip', order })}>
                              <Printer className="h-4 w-4 mr-2" />
                              Print Courier Slip
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print Modal */}
      <PrintModal
        open={printModal.open}
        onClose={() => setPrintModal({ open: false, type: 'invoice', order: null })}
        type={printModal.type}
        order={printModal.order}
        storeSettings={storeSettings as any || {
          store_name: 'My Store',
          store_logo: '',
          store_tagline: '',
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
        }}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
