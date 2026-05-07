import { useRef, useEffect } from 'react';
import { Printer, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Order, OrderItem } from '@/hooks/useOrders';
import { StoreSettings } from '@/hooks/useStoreSettings';
import { OrderInvoice } from './OrderInvoice';
import { CourierSlip } from './CourierSlip';
import { CourierLabel } from './CourierLabel';

interface PrintModalProps {
  open: boolean;
  onClose: () => void;
  type: 'invoice' | 'courier-slip' | 'courier-label';
  order: (Order & { order_items: OrderItem[] }) | null;
  storeSettings: StoreSettings;
  formatCurrency: (amount: number) => string;
}

export function PrintModal({
  open,
  onClose,
  type,
  order,
  storeSettings,
  formatCurrency,
}: PrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Please allow popups to print');
      return;
    }

    const styles = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @page {
          size: ${type === 'invoice' ? 'A4' : '4in 6in'};
          margin: ${type === 'invoice' ? '10mm' : '5mm'};
        }
        .invoice-print, .courier-slip-print, .courier-label-print {
          background: white !important;
          color: black !important;
        }
        .bg-gray-100 { background-color: #f3f4f6 !important; }
        .bg-gray-50 { background-color: #f9fafb !important; }
        .bg-green-100 { background-color: #dcfce7 !important; }
        .bg-green-50 { background-color: #f0fdf4 !important; }
        .bg-red-100 { background-color: #fee2e2 !important; }
        .bg-red-50 { background-color: #fef2f2 !important; }
        .bg-yellow-100 { background-color: #fef3c7 !important; }
        .bg-orange-100 { background-color: #ffedd5 !important; }
        .text-green-600 { color: #16a34a !important; }
        .text-green-800 { color: #166534 !important; }
        .text-red-600 { color: #dc2626 !important; }
        .text-red-800 { color: #991b1b !important; }
        .text-yellow-800 { color: #854d0e !important; }
        .text-orange-600 { color: #ea580c !important; }
        .text-gray-600 { color: #4b5563 !important; }
        .text-gray-500 { color: #6b7280 !important; }
        .text-gray-800 { color: #1f2937 !important; }
        .border-black { border-color: #000 !important; }
        .border-gray-300 { border-color: #d1d5db !important; }
        .border-gray-400 { border-color: #9ca3af !important; }
        .border-green-500 { border-color: #22c55e !important; }
        .border-red-500 { border-color: #ef4444 !important; }
        .border-orange-500 { border-color: #f97316 !important; }
        table { border-collapse: collapse; width: 100%; }
        img { max-width: 100%; height: auto; }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${type === 'invoice' ? 'Invoice' : 'Courier Slip'} - ${order?.order_number}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          ${styles}
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {type === 'invoice' ? 'Order Invoice' : type === 'courier-slip' ? 'Courier Slip' : 'Courier Label'} - {order.order_number}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Print Actions */}
        <div className="flex gap-3 mb-4 print:hidden">
          <Button onClick={handlePrint} className="btn-accent">
            <Printer className="h-4 w-4 mr-2" />
            Print {type === 'invoice' ? 'Invoice' : type === 'courier-slip' ? 'Slip' : 'Label'}
          </Button>
        </div>

        {/* Print Preview */}
        <div className="border rounded-lg overflow-hidden bg-white">
          <div 
            ref={printRef} 
            className={type === 'invoice' ? 'min-h-[800px]' : 'min-h-[400px]'}
          >
            {type === 'invoice' ? (
              <OrderInvoice
                order={order}
                storeSettings={storeSettings}
                formatCurrency={formatCurrency}
              />
            ) : type === 'courier-slip' ? (
              <CourierSlip
                order={order}
                storeSettings={storeSettings}
                formatCurrency={formatCurrency}
              />
            ) : (
              <CourierLabel
                order={order}
                storeSettings={storeSettings}
                formatCurrency={formatCurrency}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
