import { forwardRef } from 'react';
import { format } from 'date-fns';
import { Order, OrderItem } from '@/hooks/useOrders';
import { StoreSettings } from '@/hooks/useStoreSettings';

interface OrderInvoiceProps {
  order: Order & { order_items: OrderItem[] };
  storeSettings: StoreSettings;
  formatCurrency: (amount: number) => string;
}

export const OrderInvoice = forwardRef<HTMLDivElement, OrderInvoiceProps>(
  ({ order, storeSettings, formatCurrency }, ref) => {
    const getPaymentMethodLabel = (method: string) => {
      switch (method) {
        case 'cod': return 'Cash on Delivery';
        case 'card': return 'Card Payment';
        case 'bkash': return 'bKash';
        default: return method.toUpperCase();
      }
    };

    const getStatusLabel = (status: string) => {
      return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
      <div ref={ref} className="invoice-print bg-white text-black p-8 max-w-[210mm] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-6">
          <div>
            {storeSettings.store_logo && (
              <img 
                src={storeSettings.store_logo} 
                alt={storeSettings.store_name} 
                className="h-16 mb-2 object-contain"
              />
            )}
            <h1 className="text-2xl font-bold">{storeSettings.store_name || 'Store'}</h1>
            {storeSettings.store_address && (
              <p className="text-sm text-gray-600">{storeSettings.store_address}</p>
            )}
            {storeSettings.store_city && (
              <p className="text-sm text-gray-600">{storeSettings.store_city}</p>
            )}
            {storeSettings.store_phone && (
              <p className="text-sm text-gray-600">Phone: {storeSettings.store_phone}</p>
            )}
            {storeSettings.store_email && (
              <p className="text-sm text-gray-600">Email: {storeSettings.store_email}</p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-800">INVOICE</h2>
            <div className="mt-4 text-sm">
              <p><span className="font-semibold">Order No:</span> {order.order_number}</p>
              <p><span className="font-semibold">Date:</span> {format(new Date(order.created_at), 'dd MMM yyyy')}</p>
              <p><span className="font-semibold">Payment:</span> {getPaymentMethodLabel(order.payment_method)}</p>
              <p>
                <span className="font-semibold">Status:</span>{' '}
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {getStatusLabel(order.status)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">BILL TO</h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="font-semibold text-lg">{order.customer_name}</p>
              <p className="text-sm text-gray-600">Phone: {order.customer_phone}</p>
              {order.customer_email && (
                <p className="text-sm text-gray-600">Email: {order.customer_email}</p>
              )}
            </div>
            <div>
              <p className="font-semibold">Shipping Address:</p>
              <p className="text-sm text-gray-600">{order.shipping_address}</p>
              <p className="text-sm text-gray-600">{order.shipping_city}</p>
            </div>
          </div>
          {order.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-sm"><span className="font-semibold">Notes:</span> {order.notes}</p>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">SL</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Product</th>
                <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Unit Price</th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">Qty</th>
                <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items?.map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{index + 1}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{item.product_name}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-right">{formatCurrency(item.price)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-center">{item.quantity}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-right font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-sm">Subtotal</span>
              <span className="text-sm">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-sm">Shipping ({order.shipping_method})</span>
              <span className="text-sm">{formatCurrency(order.shipping_cost)}</span>
            </div>
            <div className="flex justify-between py-3 border-b-2 border-black font-bold text-lg">
              <span>Grand Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-6 mt-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-gray-600">Thank you for your order!</p>
              <p className="text-xs text-gray-500 mt-2">
                For any questions about this invoice, please contact us.
              </p>
            </div>
            <div className="text-right">
              <div className="border-t border-black w-48 ml-auto mt-12 pt-2">
                <p className="text-sm text-gray-600">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

OrderInvoice.displayName = 'OrderInvoice';
