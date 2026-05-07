import { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { OrderTimeline } from '@/components/tracking/OrderTimeline';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
  processing: { icon: Package, color: 'text-blue-500', label: 'Processing' },
  shipped: { icon: Truck, color: 'text-purple-500', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'text-green-500', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'text-red-500', label: 'Cancelled' },
};

export default function TrackOrderPage() {
  const { t, formatCurrency } = useSiteSettings();
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: order, isLoading, error } = useOrderTracking(
    submitted ? orderNumber : '',
    submitted ? phone : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const status = order?.status || 'pending';
  const StatusIcon = statusConfig[status]?.icon || Clock;

  return (
    <Layout>
      <div className="container-shop section-padding">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 text-center">Track Your Order</h1>
          <p className="text-muted-foreground text-center mb-8">
            Enter your order number and phone to check status
          </p>

          <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 mb-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Order Number</label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => { setOrderNumber(e.target.value); setSubmitted(false); }}
                  className="input-shop"
                  placeholder="e.g., ORD-12345678"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setSubmitted(false); }}
                  className="input-shop"
                  placeholder="Your phone number"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Last 4 digits are enough</p>
              </div>
              <Button type="submit" className="btn-accent w-full" disabled={isLoading}>
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? 'Searching...' : 'Track Order'}
              </Button>
            </div>
          </form>

          {submitted && error && (
            <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-center">
              {error.message}
            </div>
          )}

          {order && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Status Banner */}
              <div className="bg-secondary/50 p-6 text-center">
                <StatusIcon className={`h-12 w-12 mx-auto mb-3 ${statusConfig[status]?.color}`} />
                <h2 className="text-xl font-bold">{statusConfig[status]?.label}</h2>
                <p className="text-muted-foreground">Order #{order.order_number}</p>
              </div>

              {/* Order Details */}
              <div className="p-6 space-y-6">
                {/* Order Timeline */}
                <div>
                  <h3 className="font-semibold mb-4">Order Progress</h3>
                  <OrderTimeline
                    currentStatus={status}
                    courierStatus={order.courier_status}
                    createdAt={order.created_at}
                    updatedAt={order.updated_at}
                    courierCreatedAt={order.courier_created_at}
                    courierUpdatedAt={order.courier_updated_at}
                  />
                </div>

                {/* Courier Info */}
                {order.courier_tracking_id && (
                  <div className="bg-accent/10 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Courier Tracking</h3>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Provider:</span>{' '}
                      <span className="font-medium capitalize">{order.courier_provider || 'Courier'}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Tracking ID:</span>{' '}
                      <span className="font-mono font-bold">{order.courier_tracking_id}</span>
                    </p>
                    {order.courier_consignment_id && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Consignment:</span>{' '}
                        <span className="font-mono">{order.courier_consignment_id}</span>
                      </p>
                    )}
                    {order.courier_status && (
                      <p className="text-sm mt-2">
                        <span className="text-muted-foreground">Status:</span>{' '}
                        <span className="font-medium text-accent">{order.courier_status}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Shipping */}
                <div>
                  <h3 className="font-semibold mb-2">Shipping Address</h3>
                  <p className="text-muted-foreground text-sm">
                    {order.customer_name}<br />
                    {order.shipping_address}<br />
                    {order.shipping_city}
                  </p>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-semibold mb-2">Order Items</h3>
                  <div className="space-y-2">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.product_name} × {item.quantity}</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatCurrency(order.shipping_cost)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
