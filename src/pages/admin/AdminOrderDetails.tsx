import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Printer, CheckCircle, Send, Loader2, MessageCircle } from 'lucide-react';
import { useOrder, useUpdateOrderStatus } from '@/hooks/useOrders';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PrintModal } from '@/components/admin/PrintModal';
import { OrderCourierSection } from '@/components/admin/OrderCourierSection';

import { useState } from 'react';

const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

export default function AdminOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading, refetch } = useOrder(id || '');
  const { data: storeSettings } = useStoreSettings();
  const updateStatus = useUpdateOrderStatus();
  const { t, formatCurrency, settings } = useSiteSettings();
  const [printModal, setPrintModal] = useState<{ open: boolean; type: 'invoice' | 'courier-slip' | 'courier-label' }>({
    open: false,
    type: 'invoice',
  });
  

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

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    await updateStatus.mutateAsync({ id: order.id, status: newStatus as any });
    if (newStatus === 'confirmed' && !order.fb_purchase_sent) {
      sendPurchaseEvent();
    }
    refetch();
  };

  const sendPurchaseEvent = async () => {
    if (!order) return;
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
        await supabase.from('orders').update({ fb_purchase_sent: true }).eq('id', order.id);
        refetch();
        toast.success('Purchase event sent to Meta');
      } else if (data?.skipped) {
        toast.info(`Purchase event skipped: ${data.reason}`);
      }
    } catch (err: any) {
      toast.error('Failed to send Purchase event: ' + (err.message || 'Unknown error'));
    }
  };

  const markAsPaid = async () => {
    if (!order) return;
    await supabase
      .from('orders')
      .update({ payment_status: 'paid', paid_amount: order.total, due_amount: 0 })
      .eq('id', order.id);
    refetch();
    toast.success('Marked as paid');
  };

  const getWhatsAppStatusMessage = (status: string) => {
    const storeName = storeSettings?.store_name || 'Our Store';
    const orderNo = order?.order_number || '';
    const name = order?.customer_name || 'Customer';
    const lang = settings.language || 'en';
    const trackingId = (order as any)?.courier_tracking_id;

    const templates: Record<string, Record<string, string>> = {
      en: {
        pending: `Hello ${name},\n\nThank you for your order *${orderNo}* from *${storeName}*! 🛍️\n\nYour order is currently *Pending*. We will confirm it shortly.\n\nThank you! 🙏`,
        confirmed: `Hello ${name},\n\nGreat news! Your order *${orderNo}* from *${storeName}* has been *Confirmed* ✅\n\nWe are preparing your order now.\n\nThank you for shopping with us! 🙏`,
        processing: `Hello ${name},\n\nYour order *${orderNo}* from *${storeName}* is now being *Processed* 📦\n\nWe'll notify you once it's shipped.\n\nThank you! 🙏`,
        shipped: `Hello ${name},\n\nYour order *${orderNo}* from *${storeName}* has been *Shipped* 🚚\n\n${trackingId ? `Tracking ID: *${trackingId}*\n` : ''}Your order is on the way!\n\nThank you! 🙏`,
        delivered: `Hello ${name},\n\nYour order *${orderNo}* from *${storeName}* has been *Delivered* ✅🎉\n\nWe hope you enjoy your purchase! If you have any questions, feel free to reach out.\n\nThank you! 🙏`,
        cancelled: `Hello ${name},\n\nWe're sorry to inform you that your order *${orderNo}* from *${storeName}* has been *Cancelled* ❌\n\nIf you have any questions, please contact us.\n\nThank you! 🙏`,
      },
      bn: {
        pending: `প্রিয় ${name},\n\n*${storeName}* থেকে আপনার অর্ডার *${orderNo}* এর জন্য ধন্যবাদ! 🛍️\n\nআপনার অর্ডার বর্তমানে *পেন্ডিং* আছে। আমরা শীঘ্রই নিশ্চিত করব।\n\nধন্যবাদ! 🙏`,
        confirmed: `প্রিয় ${name},\n\nশুভ সংবাদ! *${storeName}* থেকে আপনার অর্ডার *${orderNo}* *কনফার্ম* হয়েছে ✅\n\nআমরা আপনার অর্ডার প্রস্তুত করছি।\n\nআমাদের সাথে কেনাকাটার জন্য ধন্যবাদ! 🙏`,
        processing: `প্রিয় ${name},\n\n*${storeName}* থেকে আপনার অর্ডার *${orderNo}* এখন *প্রসেসিং* হচ্ছে 📦\n\nশিপমেন্ট হলে আমরা আপনাকে জানাব।\n\nধন্যবাদ! 🙏`,
        shipped: `প্রিয় ${name},\n\n*${storeName}* থেকে আপনার অর্ডার *${orderNo}* *শিপ* করা হয়েছে 🚚\n\n${trackingId ? `ট্র্যাকিং আইডি: *${trackingId}*\n` : ''}আপনার অর্ডার পথে আছে!\n\nধন্যবাদ! 🙏`,
        delivered: `প্রিয় ${name},\n\n*${storeName}* থেকে আপনার অর্ডার *${orderNo}* *ডেলিভারি* হয়েছে ✅🎉\n\nআশা করি আপনি পণ্যটি পছন্দ করবেন! কোনো প্রশ্ন থাকলে যোগাযোগ করুন।\n\nধন্যবাদ! 🙏`,
        cancelled: `প্রিয় ${name},\n\nদুঃখিত, *${storeName}* থেকে আপনার অর্ডার *${orderNo}* *বাতিল* করা হয়েছে ❌\n\nকোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।\n\nধন্যবাদ! 🙏`,
      },
      hi: {
        pending: `नमस्ते ${name},\n\n*${storeName}* से आपके ऑर्डर *${orderNo}* के लिए धन्यवाद! 🛍️\n\nआपका ऑर्डर अभी *पेंडिंग* है। हम जल्द ही इसे कन्फर्म करेंगे।\n\nधन्यवाद! 🙏`,
        confirmed: `नमस्ते ${name},\n\nबधाई हो! *${storeName}* से आपका ऑर्डर *${orderNo}* *कन्फर्म* हो गया है ✅\n\nहम आपका ऑर्डर तैयार कर रहे हैं।\n\nहमसे खरीदारी के लिए धन्यवाद! 🙏`,
        processing: `नमस्ते ${name},\n\n*${storeName}* से आपका ऑर्डर *${orderNo}* अब *प्रोसेसिंग* में है 📦\n\nशिप होने पर हम आपको सूचित करेंगे।\n\nधन्यवाद! 🙏`,
        shipped: `नमस्ते ${name},\n\n*${storeName}* से आपका ऑर्डर *${orderNo}* *शिप* कर दिया गया है 🚚\n\n${trackingId ? `ट्रैकिंग आईडी: *${trackingId}*\n` : ''}आपका ऑर्डर रास्ते में है!\n\nधन्यवाद! 🙏`,
        delivered: `नमस्ते ${name},\n\n*${storeName}* से आपका ऑर्डर *${orderNo}* *डिलीवर* हो गया है ✅🎉\n\nहमें उम्मीद है कि आपको प्रोडक्ट पसंद आएगा! कोई सवाल हो तो संपर्क करें।\n\nधन्यवाद! 🙏`,
        cancelled: `नमस्ते ${name},\n\nक्षमा करें, *${storeName}* से आपका ऑर्डर *${orderNo}* *रद्द* कर दिया गया है ❌\n\nकोई सवाल हो तो हमसे संपर्क करें।\n\nधन्यवाद! 🙏`,
      },
    };

    const msgs = templates[lang] || templates.en;
    return msgs[status] || msgs.pending;
  };

  const getDialCode = (countryCode: string): string => {
    const dialCodes: Record<string, string> = {
      BD: '880', IN: '91', PK: '92', US: '1', GB: '44', AE: '971', SA: '966',
      MY: '60', SG: '65', AU: '61', CA: '1', DE: '49', FR: '33', IT: '39',
      ES: '34', NL: '31', TR: '90', EG: '20', NG: '234', KE: '254', ZA: '27',
      BR: '55', MX: '52', JP: '81', KR: '82', CN: '86', ID: '62', TH: '66',
      PH: '63', VN: '84', NP: '977', LK: '94', MM: '95', QA: '974', KW: '965',
      BH: '973', OM: '968', JO: '962', LB: '961', IQ: '964',
    };
    return dialCodes[countryCode] || '880';
  };

  const sendWhatsAppStatus = () => {
    if (!order) return;
    let phone = order.customer_phone.replace(/[^0-9]/g, '');
    const dialCode = getDialCode(settings.default_country_code);
    // If phone doesn't already start with the country dial code, prepend it
    if (!phone.startsWith(dialCode)) {
      // Remove leading zero if present (local format)
      phone = phone.replace(/^0+/, '');
      phone = dialCode + phone;
    }
    const message = encodeURIComponent(getWhatsAppStatusMessage(order.status));
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Order not found</p>
        <Button onClick={() => navigate('/admin/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{order.order_number}</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(order.created_at), 'MMMM dd, yyyy · hh:mm a')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={order.status} onValueChange={handleStatusChange}>
            <SelectTrigger className={`w-40 ${getStatusColor(order.status)}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>{t(`order.status.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <img
                    src={item.product_image || '/placeholder.svg'}
                    alt={item.product_name}
                    className="w-14 h-14 rounded-lg object-cover bg-secondary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{item.product_name}</p>
                    {item.variant_info && typeof item.variant_info === 'object' && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {Object.entries(item.variant_info as Record<string, any>)
                          .filter(([_, v]) => v != null && v !== '')
                          .map(([key, value]) => (
                            <span key={key} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs">
                              <span className="font-medium capitalize text-muted-foreground">{key}:</span>
                              <span className="font-semibold">{String(value)}</span>
                            </span>
                          ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium text-sm">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-border mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('cart.shipping')}</span>
                <span>{formatCurrency(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                <span>{t('cart.total')}</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Payment Info</h2>
              <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${
                order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                order.payment_status === 'partial_paid' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {order.payment_status === 'paid' ? 'Paid' :
                 order.payment_status === 'partial_paid' ? 'Partial Paid' : 'Unpaid'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Method</span>
                <p className="font-medium">{order.payment_method_name || order.payment_method}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Shipping Method</span>
                <p className="font-medium">{order.shipping_method}</p>
              </div>
              {(order.paid_amount > 0 || order.due_amount > 0) && (
                <>
                  <div>
                    <span className="text-muted-foreground">Paid</span>
                    <p className="font-medium">{formatCurrency(order.paid_amount)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Due</span>
                    <p className="font-medium">{formatCurrency(order.due_amount)}</p>
                  </div>
                </>
              )}
              {order.transaction_id && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <p className="font-medium font-mono">{order.transaction_id}</p>
                </div>
              )}
            </div>
            {order.payment_status !== 'paid' && (
              <Button size="sm" variant="outline" className="mt-4 gap-2" onClick={markAsPaid}>
                <CheckCircle className="h-4 w-4" />
                Mark as Paid
              </Button>
            )}
          </div>

          {/* Courier Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <OrderCourierSection
              order={order}
              onPrintLabel={() => setPrintModal({ open: true, type: 'courier-label' })}
            />
          </div>

          {/* Meta Purchase Event */}
          {order.status === 'confirmed' && (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm">Meta Purchase Event</h2>
                  <p className="text-xs text-muted-foreground">
                    {order.fb_purchase_sent ? '✅ Purchase event already sent' : '⚠️ Purchase event not sent yet'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={order.fb_purchase_sent ? 'outline' : 'default'}
                  onClick={sendPurchaseEvent}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {order.fb_purchase_sent ? 'Resend' : 'Send'} Purchase Event
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold mb-4">Customer</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Name</span>
                <p className="font-medium">{order.customer_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Phone</span>
                <a href={`tel:${order.customer_phone}`} className="block font-medium text-primary hover:underline">{order.customer_phone}</a>
              </div>
              {order.customer_email && (
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p className="font-medium">{order.customer_email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold mb-4">Shipping Address</h2>
            <p className="text-sm">{order.shipping_address}</p>
            {order.shipping_city && order.shipping_city !== '-' && (
              <p className="text-sm text-muted-foreground">{order.shipping_city}</p>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-semibold mb-2">Notes</h2>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}

          {/* Print Actions */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-3">
            <h2 className="font-semibold mb-2">Print</h2>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setPrintModal({ open: true, type: 'invoice' })}>
              <FileText className="h-4 w-4" />
              Print Invoice
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setPrintModal({ open: true, type: 'courier-slip' })}>
              <Printer className="h-4 w-4" />
              Print Courier Slip
            </Button>
          </div>

          {/* WhatsApp Status */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold mb-3">Send Status via WhatsApp</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Send current order status ({order.status}) to {order.customer_name} on WhatsApp
            </p>
            <Button
              className="w-full gap-2 bg-[#25D366] hover:bg-[#1da851] text-white"
              onClick={sendWhatsAppStatus}
            >
              <MessageCircle className="h-4 w-4" />
              Send on WhatsApp
            </Button>
          </div>
        </div>
      </div>

      {/* Print Modal */}
      <PrintModal
        open={printModal.open}
        onClose={() => setPrintModal({ open: false, type: 'invoice' })}
        type={printModal.type}
        order={order}
        storeSettings={storeSettings as any || {
          store_name: 'My Store', store_logo: '', store_tagline: '', store_email: '',
          store_phone: '', store_address: '', store_city: '', store_postal_code: '',
          facebook_url: '', instagram_url: '', twitter_url: '', youtube_url: '',
          whatsapp_number: '', footer_text: '',
        }}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
