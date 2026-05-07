import { forwardRef } from 'react';
import { format } from 'date-fns';
import { Order } from '@/hooks/useOrders';
import { StoreSettings } from '@/hooks/useStoreSettings';

interface CourierLabelProps {
  order: Order & {
    courier_tracking_id?: string | null;
    courier_consignment_id?: string | null;
  };
  storeSettings: StoreSettings;
  formatCurrency: (amount: number) => string;
}

export const CourierLabel = forwardRef<HTMLDivElement, CourierLabelProps>(
  ({ order, storeSettings, formatCurrency }, ref) => {
    const isCOD = order.payment_method === 'cod';
    const itemCount = (order as any).order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 1;
    
    // Generate items summary
    const itemsSummary = (order as any).order_items?.map((item: any) => 
      `${item.product_name} x${item.quantity}`
    ).join(', ') || 'N/A';

    return (
      <div 
        ref={ref} 
        className="courier-label-print bg-white text-black p-4"
        style={{ 
          width: '4in', 
          minHeight: '6in',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {/* Header with Provider */}
        <div className="text-center border-b-2 border-black pb-2 mb-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Steadfast Courier</p>
          <h1 className="text-xl font-black">SHIPPING LABEL</h1>
        </div>

        {/* Tracking Barcode Area */}
        <div className="text-center border-2 border-black p-3 mb-3 bg-gray-50">
          <p className="text-xs text-gray-600 mb-1">TRACKING CODE</p>
          <p className="text-2xl font-black tracking-wider font-mono">
            {order.courier_tracking_id || order.order_number}
          </p>
          {order.courier_consignment_id && (
            <p className="text-xs text-gray-500 mt-1">
              CN: {order.courier_consignment_id}
            </p>
          )}
        </div>

        {/* Receiver Section - Most Important */}
        <div className="border-2 border-black p-3 mb-3">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold uppercase text-gray-600">TO:</p>
            <span className="text-xs text-gray-500">
              {format(new Date(order.created_at), 'dd/MM/yyyy')}
            </span>
          </div>
          <p className="text-xl font-bold leading-tight">{order.customer_name}</p>
          <p className="text-3xl font-black mt-2 tracking-wide font-mono">{order.customer_phone}</p>
          <div className="mt-3 pt-2 border-t border-gray-300">
            <p className="text-sm leading-relaxed">{order.shipping_address}</p>
            <p className="text-base font-bold mt-1">{order.shipping_city}</p>
          </div>
        </div>

        {/* COD / Payment Section */}
        <div className={`p-4 mb-3 text-center ${isCOD ? 'bg-orange-100 border-2 border-orange-500' : 'bg-green-100 border-2 border-green-500'}`}>
          <p className="text-sm font-bold uppercase">
            {isCOD ? 'CASH ON DELIVERY' : 'PREPAID'}
          </p>
          <p className={`text-3xl font-black ${isCOD ? 'text-orange-600' : 'text-green-600'}`}>
            {isCOD ? formatCurrency(order.total) : '৳0.00'}
          </p>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <div className="border border-gray-300 p-2">
            <p className="text-xs text-gray-600">Order No</p>
            <p className="font-bold">{order.order_number}</p>
          </div>
          <div className="border border-gray-300 p-2">
            <p className="text-xs text-gray-600">Items</p>
            <p className="font-bold">{itemCount} pcs</p>
          </div>
        </div>

        {/* Items Summary */}
        <div className="border border-gray-300 p-2 mb-3 text-xs">
          <p className="text-gray-600 mb-1">Contents:</p>
          <p className="line-clamp-2">{itemsSummary}</p>
        </div>

        {/* Sender Section */}
        <div className="border border-gray-400 p-2 mb-3 bg-gray-50">
          <p className="text-xs font-bold uppercase text-gray-600 mb-1">FROM:</p>
          <p className="font-bold text-sm">{storeSettings.store_name || 'Store'}</p>
          {storeSettings.store_phone && (
            <p className="text-xs">Tel: {storeSettings.store_phone}</p>
          )}
          {storeSettings.store_address && (
            <p className="text-xs text-gray-600">{storeSettings.store_address}</p>
          )}
        </div>

        {/* Special Instructions */}
        {order.notes && (
          <div className="border border-dashed border-gray-400 p-2 mb-3">
            <p className="text-xs font-bold uppercase text-gray-600">Note:</p>
            <p className="text-xs">{order.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-2 border-t-2 border-black">
          <p className="text-xs text-gray-500">📦 HANDLE WITH CARE</p>
        </div>
      </div>
    );
  }
);

CourierLabel.displayName = 'CourierLabel';
