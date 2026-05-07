import { forwardRef } from 'react';
import { format } from 'date-fns';
import { Order } from '@/hooks/useOrders';
import { StoreSettings } from '@/hooks/useStoreSettings';

interface CourierSlipProps {
  order: Order;
  storeSettings: StoreSettings;
  formatCurrency: (amount: number) => string;
}

export const CourierSlip = forwardRef<HTMLDivElement, CourierSlipProps>(
  ({ order, storeSettings, formatCurrency }, ref) => {
    const isCOD = order.payment_method === 'cod';
    const itemCount = (order as any).order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 1;

    return (
      <div ref={ref} className="courier-slip-print bg-white text-black p-6 max-w-[4in] mx-auto border-2 border-black">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <h1 className="text-xl font-black tracking-wide">COURIER SLIP</h1>
          <p className="text-2xl font-bold mt-1">{order.order_number}</p>
          <p className="text-sm text-gray-600">{format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}</p>
        </div>

        {/* Receiver Section */}
        <div className="border-2 border-black p-3 mb-4 bg-gray-50">
          <p className="text-xs font-bold uppercase text-gray-600 mb-1">DELIVER TO:</p>
          <p className="text-xl font-bold leading-tight">{order.customer_name}</p>
          <p className="text-2xl font-black mt-2 tracking-wide">{order.customer_phone}</p>
          <div className="mt-3 pt-2 border-t border-gray-300">
            <p className="text-sm leading-snug">{order.shipping_address}</p>
            <p className="text-sm font-semibold">{order.shipping_city}</p>
          </div>
        </div>

        {/* Sender Section */}
        <div className="border border-gray-400 p-3 mb-4">
          <p className="text-xs font-bold uppercase text-gray-600 mb-1">FROM:</p>
          <p className="font-bold">{storeSettings.store_name || 'Store'}</p>
          {storeSettings.store_phone && (
            <p className="text-sm">Phone: {storeSettings.store_phone}</p>
          )}
          {storeSettings.store_address && (
            <p className="text-sm text-gray-600">{storeSettings.store_address}</p>
          )}
        </div>

        {/* Payment & Amount Section */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`p-3 border-2 ${isCOD ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
            <p className="text-xs font-bold uppercase text-gray-600">Payment</p>
            <p className={`text-lg font-black ${isCOD ? 'text-red-600' : 'text-green-600'}`}>
              {isCOD ? 'COD' : 'PAID'}
            </p>
          </div>
          {isCOD && (
            <div className="p-3 border-2 border-red-500 bg-red-50">
              <p className="text-xs font-bold uppercase text-gray-600">Collect</p>
              <p className="text-lg font-black text-red-600">
                {formatCurrency(order.total)}
              </p>
            </div>
          )}
          {!isCOD && (
            <div className="p-3 border-2 border-green-500 bg-green-50">
              <p className="text-xs font-bold uppercase text-gray-600">Amount</p>
              <p className="text-lg font-black text-green-600">
                {formatCurrency(order.total)}
              </p>
            </div>
          )}
        </div>

        {/* Package Info */}
        <div className="flex justify-between items-center border border-gray-300 p-2 mb-4">
          <div>
            <p className="text-xs text-gray-600">Items</p>
            <p className="font-bold">{itemCount} pcs</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600">Shipping</p>
            <p className="font-bold text-sm">{order.shipping_method}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Weight</p>
            <p className="font-bold">—</p>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="border border-dashed border-gray-400 p-2 mb-4">
            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Delivery Notes:</p>
            <p className="text-sm">{order.notes}</p>
          </div>
        )}

        {/* Handle with care */}
        <div className="text-center py-2 border-t border-dashed border-gray-400">
          <p className="text-xs font-semibold text-gray-500">📦 HANDLE WITH CARE</p>
        </div>

        {/* Barcode placeholder */}
        <div className="text-center mt-4 pt-3 border-t border-black">
          <div className="font-mono text-lg tracking-widest">{order.order_number}</div>
        </div>
      </div>
    );
  }
);

CourierSlip.displayName = 'CourierSlip';
