import { useState } from 'react';
import { Truck, Package, RefreshCw, Printer, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Order } from '@/hooks/useOrders';
import { useCourierSettings, useCreateCourierParcel, useTrackCourierStatus } from '@/hooks/useCourierSettings';
import { format } from 'date-fns';

interface OrderCourierSectionProps {
  order: Order & { 
    courier_provider?: string | null;
    courier_status?: string | null;
    courier_tracking_id?: string | null;
    courier_consignment_id?: string | null;
    courier_created_at?: string | null;
    courier_updated_at?: string | null;
  };
  onPrintLabel: () => void;
}

export function OrderCourierSection({ order, onPrintLabel }: OrderCourierSectionProps) {
  const { data: settings } = useCourierSettings('steadfast');
  const createParcel = useCreateCourierParcel();
  const trackStatus = useTrackCourierStatus();
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isRecreate, setIsRecreate] = useState(false);

  const hasParcel = !!order.courier_consignment_id;
  const isCOD = order.payment_method === 'cod';

  const getCourierStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'created':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Created</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'in_transit':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">In Transit</Badge>;
      case 'delivered':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Not Created</Badge>;
    }
  };

  const handleCreateParcel = async () => {
    const fullAddress = `${order.shipping_address}, ${order.shipping_city}`;
    
    await createParcel.mutateAsync({
      order_id: order.id,
      recipient_name: order.customer_name,
      recipient_phone: order.customer_phone,
      recipient_address: fullAddress,
      recipient_city: order.shipping_city,
      cod_amount: isCOD ? order.total : 0,
      invoice: order.order_number,
      note: order.notes || undefined,
    });
    
    setShowConfirmDialog(false);
  };

  const handleTrackStatus = async () => {
    if (!order.courier_consignment_id) return;
    
    await trackStatus.mutateAsync({
      consignment_id: order.courier_consignment_id,
      order_id: order.id,
    });
  };

  const openCreateDialog = (recreate: boolean) => {
    setIsRecreate(recreate);
    setShowConfirmDialog(true);
  };

  if (!settings?.enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="h-5 w-5" />
            Courier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Courier integration is not configured.</p>
            <p className="text-sm">Go to Settings → Courier to set up Steadfast.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="h-5 w-5" />
            Courier - Steadfast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Row */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            {getCourierStatusBadge(order.courier_status)}
          </div>

          {/* Tracking Info */}
          {hasParcel && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tracking ID</span>
                <span className="font-mono text-sm font-medium">
                  {order.courier_tracking_id || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Consignment ID</span>
                <span className="font-mono text-sm">
                  {order.courier_consignment_id}
                </span>
              </div>
              {order.courier_updated_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(order.courier_updated_at), 'dd MMM, hh:mm a')}
                  </span>
                </div>
              )}
            </>
          )}

          {/* COD Info */}
          <div className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-lg">
            <span className="text-sm font-medium">COD Amount</span>
            <span className={`font-bold ${isCOD ? 'text-orange-600' : 'text-green-600'}`}>
              {isCOD ? `৳${order.total.toFixed(2)}` : 'Prepaid (৳0)'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {!hasParcel ? (
              <Button 
                onClick={() => openCreateDialog(false)}
                disabled={createParcel.isPending}
                className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-white border-none"
              >
                {createParcel.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Package className="h-4 w-4 mr-2" />
                )}
                Create Parcel
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline"
                  onClick={handleTrackStatus}
                  disabled={trackStatus.isPending}
                >
                  {trackStatus.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh Status
                </Button>
                <Button 
                  variant="outline"
                  onClick={onPrintLabel}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Label
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => openCreateDialog(true)}
                  disabled={createParcel.isPending}
                  className="text-muted-foreground"
                >
                  Recreate Parcel
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRecreate ? 'Recreate Parcel?' : 'Create Courier Parcel'}
            </DialogTitle>
            <DialogDescription>
              {isRecreate 
                ? 'This will create a new parcel in Steadfast. The old parcel will not be cancelled automatically.'
                : 'This will create a parcel in Steadfast for delivery.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order</span>
              <span className="font-medium">{order.order_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Recipient</span>
              <span>{order.customer_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-mono">{order.customer_phone}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Address</span>
              <span className="text-right max-w-[200px]">{order.shipping_address}, {order.shipping_city}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-3">
              <span className="text-muted-foreground">COD Amount</span>
              <span className={`font-bold ${isCOD ? 'text-orange-600' : 'text-green-600'}`}>
                {isCOD ? `৳${order.total.toFixed(2)}` : '৳0 (Prepaid)'}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateParcel} 
              disabled={createParcel.isPending}
              className="bg-[#f59e0b] hover:bg-[#d97706] text-white border-none"
            >
              {createParcel.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirm & Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
