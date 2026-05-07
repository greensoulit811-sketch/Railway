import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useAuth } from '@/hooks/useAuth';
import { useCreateOrder } from '@/hooks/useOrders';
import { useIncrementCouponUsage, Coupon } from '@/hooks/useCoupons';
import { useShippingMethods } from '@/hooks/useShippingMethods';
import { usePaymentMethods, PaymentMethod } from '@/hooks/usePaymentMethods';
import { useCheckoutLeadCapture, useConvertLead } from '@/hooks/useCheckoutLeads';
import { CouponInput } from '@/components/checkout/CouponInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { trackInitiateCheckout } from '@/lib/facebook-pixel';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: cartItems, subtotal: cartSubtotal, clearCart } = useCart();

  const searchParams = new URLSearchParams(location.search);
  const isBuyNow = searchParams.get('mode') === 'buynow';
  const buyNowItem = location.state?.buyNowItem;

  const items = isBuyNow && buyNowItem ? [buyNowItem] : cartItems;
  
  const subtotal = useMemo(() => {
    if (isBuyNow && buyNowItem) {
      const price = buyNowItem.salePrice ?? buyNowItem.price;
      return price * buyNowItem.quantity;
    }
    return cartSubtotal;
  }, [isBuyNow, buyNowItem, cartSubtotal]);
  const { user } = useAuth();
  const { t, formatCurrency, settings } = useSiteSettings();
  const createOrder = useCreateOrder();
  const incrementCouponUsage = useIncrementCouponUsage();
  const { data: shippingMethods = [], isLoading: isLoadingMethods } = useShippingMethods(true);
  const { data: paymentMethods = [], isLoading: isLoadingPayments } = usePaymentMethods(true);
  const { debouncedSave, saveImmediately, clearLeadStorage } = useCheckoutLeadCapture();
  const convertLead = useConvertLead();

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [transactionId, setTransactionId] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    shippingMethodId: '',
    paymentMethodId: '',
  });

  // Set defaults when methods load
  useEffect(() => {
    if (shippingMethods.length > 0 && !formData.shippingMethodId) {
      setFormData(prev => ({ ...prev, shippingMethodId: shippingMethods[0].id }));
    }
  }, [shippingMethods]);

  useEffect(() => {
    if (paymentMethods.length > 0 && !formData.paymentMethodId) {
      setFormData(prev => ({ ...prev, paymentMethodId: paymentMethods[0].id }));
    }
  }, [paymentMethods]);

  const selectedShipping = shippingMethods.find(m => m.id === formData.shippingMethodId);
  const shippingCost = selectedShipping?.base_rate || 0;
  const total = subtotal - discountAmount + shippingCost;

  const selectedPayment = paymentMethods.find(m => m.id === formData.paymentMethodId);

  // Calculate partial payment
  const hasPartial = selectedPayment?.allow_partial_delivery_payment || false;
  let advanceAmount = 0;
  let dueOnDelivery = total;

  if (hasPartial && selectedPayment) {
    if (selectedPayment.partial_type === 'delivery_charge') {
      advanceAmount = shippingCost;
    } else if (selectedPayment.partial_type === 'fixed_amount') {
      advanceAmount = Math.min(selectedPayment.fixed_partial_amount || 0, total);
    }
    dueOnDelivery = total - advanceAmount;
  }

  const requiresTrxId = selectedPayment?.require_transaction_id || false;

  // Build lead data for capture
  const buildLeadData = useCallback(() => ({
    customer_name: formData.fullName,
    phone: formData.phone,
    email: '',
    address: formData.address,
    city: '',
    country: settings.default_country_name,
    notes: '',
    items: items.map((item) => ({
      product_id: item.id,
      product_name: item.name,
      unit_price: item.salePrice ?? item.price,
      quantity: item.quantity,
      line_total: (item.salePrice ?? item.price) * item.quantity,
    })),
    subtotal,
    shipping_fee: shippingCost,
    total,
    currency_code: settings.currency_code,
  }), [formData, items, subtotal, shippingCost, total, settings.currency_code]);

  useEffect(() => {
    if (formData.phone && formData.phone.trim().length >= 5 && items.length > 0) {
      debouncedSave(buildLeadData());
    }
  }, [formData, items, shippingCost, debouncedSave, buildLeadData]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (formData.phone && formData.phone.trim().length >= 5 && items.length > 0) {
        saveImmediately();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData.phone, items.length, saveImmediately]);

  const handleApplyCoupon = (coupon: Coupon, discount: number) => {
    setAppliedCoupon(coupon);
    setDiscountAmount(discount);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  useEffect(() => {
    if (items.length > 0) {
      trackInitiateCheckout({
        numItems: items.reduce((sum, item) => sum + item.quantity, 0),
        value: subtotal,
        currency: settings.currency_code,
      });
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.address) {
      toast.error(t('validation.fillRequired'));
      return;
    }

    if (items.length === 0) {
      toast.error(t('validation.cartEmpty'));
      return;
    }

    if (requiresTrxId && !transactionId.trim()) {
      toast.error('Transaction ID is required for this payment method');
      return;
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;

    // Build partial rule snapshot
    const partialSnapshot = hasPartial && selectedPayment ? {
      partial_type: selectedPayment.partial_type,
      fixed_partial_amount: selectedPayment.fixed_partial_amount,
      advance_amount: advanceAmount,
      due_on_delivery: dueOnDelivery,
    } : null;

    try {
      const orderResult = await createOrder.mutateAsync({
        order: {
          order_number: orderNumber,
          user_id: user?.id || null,
          customer_name: formData.fullName,
          customer_phone: formData.phone,
          customer_email: null,
          shipping_address: formData.address,
          shipping_city: '-',
          shipping_method: selectedShipping?.name || 'Standard',
          shipping_cost: shippingCost,
          payment_method: selectedPayment?.code || 'cod',
          subtotal,
          total,
          status: 'pending',
          notes: null,
          payment_method_id: selectedPayment?.id || null,
          payment_method_name: selectedPayment?.name || 'Cash on Delivery',
          payment_status: hasPartial ? 'partial_paid' : 'unpaid',
          paid_amount: advanceAmount,
          due_amount: dueOnDelivery,
          transaction_id: transactionId.trim() || null,
          partial_rule_snapshot: partialSnapshot,
        },
        items: items.map((item) => {
          const productId = item.id.includes('-') && item.variantId
            ? item.id.replace(`-${item.variantId}`, '')
            : item.id;
          return {
            product_id: productId,
            product_name: item.name,
            product_image: item.image,
            quantity: item.quantity,
            price: item.salePrice ?? item.price,
            variant_id: item.variantId || null,
            variant_info: item.variantInfo ? JSON.parse(JSON.stringify(item.variantInfo)) : null,
          };
        }),
      });

      if (orderResult?.id) {
        convertLead.mutate(orderResult.id);
      }
      clearLeadStorage();

      if (appliedCoupon) {
        incrementCouponUsage.mutate(appliedCoupon.id);
      }

      if (!isBuyNow) {
        clearCart();
      }
      navigate(`/order-success?orderId=${orderNumber}`);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container-shop section-padding text-center">
          <h1 className="text-2xl font-bold mb-4">{t('cart.emptyCart')}</h1>
          <Button onClick={() => navigate('/shop')} className="btn-accent">
            {t('cart.continueShopping')}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-shop section-padding">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('checkout.title')}</h1>
        <p className="text-muted-foreground mb-8">{t('checkout.formHeading')}</p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">{t('checkout.contactInfo')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('checkout.fullName')} <span className="text-destructive">*</span>
                    </label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="input-shop" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('checkout.phone')} <span className="text-destructive">*</span>
                    </label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-shop" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('checkout.address')} <span className="text-destructive">*</span>
                    </label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="input-shop" placeholder={t('checkout.addressPlaceholder')} required />
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">{t('checkout.shippingMethod')}</h2>
                {isLoadingMethods ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : shippingMethods.length === 0 ? (
                  <p className="text-muted-foreground">No shipping methods available</p>
                ) : (
                  <div className="space-y-3">
                    {shippingMethods.map((method) => (
                      <label key={method.id} className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:border-accent transition-colors">
                        <input type="radio" name="shippingMethodId" value={method.id} checked={formData.shippingMethodId === method.id} onChange={handleChange} className="w-4 h-4 text-accent" />
                        <div className="flex-1">
                          <p className="font-medium">{method.name}</p>
                          {method.estimated_days && <p className="text-sm text-muted-foreground">{method.estimated_days}</p>}
                          {method.description && <p className="text-xs text-muted-foreground mt-1">{method.description}</p>}
                        </div>
                        <span className="font-semibold">{formatCurrency(method.base_rate)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">{t('checkout.paymentMethod')}</h2>
                {isLoadingPayments ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : paymentMethods.length === 0 ? (
                  <p className="text-muted-foreground">No payment methods available</p>
                ) : (
                  <div className="space-y-3">
                    {paymentMethods.map((pm) => (
                      <label
                        key={pm.id}
                        className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.paymentMethodId === pm.id ? 'border-accent bg-accent/5' : 'border-border hover:border-accent'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethodId"
                          value={pm.id}
                          checked={formData.paymentMethodId === pm.id}
                          onChange={handleChange}
                          className="w-4 h-4 text-accent mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{pm.name}</p>
                          {pm.description && <p className="text-sm text-muted-foreground">{pm.description}</p>}
                          {pm.instructions && formData.paymentMethodId === pm.id && (
                            <div className="mt-2 p-3 bg-secondary/50 rounded-lg text-sm text-muted-foreground">
                              {pm.instructions}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* Transaction ID input */}
                {requiresTrxId && formData.paymentMethodId && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">
                      Transaction ID <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter your transaction/reference ID"
                      required
                    />
                  </div>
                )}

                {/* Partial Payment Breakdown */}
                {hasPartial && formData.paymentMethodId && (
                  <div className="mt-4 p-4 border border-accent/30 bg-accent/5 rounded-lg">
                    <h3 className="font-semibold text-sm mb-2">Payment Breakdown</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Pay now (advance):</span>
                        <span className="font-semibold">{formatCurrency(advanceAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pay on delivery:</span>
                        <span className="font-semibold">{formatCurrency(dueOnDelivery)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-4">{t('checkout.orderSummary')}</h2>

                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                  {items.map((item) => {
                    const price = item.salePrice ?? item.price;
                    return (
                      <div key={item.id} className="flex gap-3">
                        <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover bg-secondary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{t('product.quantity')}: {item.quantity}</p>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(price * item.quantity)}</span>
                      </div>
                    );
                  })}
                </div>

                <hr className="border-border mb-4" />

                <div className="mb-4">
                  <CouponInput
                    subtotal={subtotal}
                    onApply={handleApplyCoupon}
                    onRemove={handleRemoveCoupon}
                    appliedCoupon={appliedCoupon}
                    discountAmount={discountAmount}
                  />
                </div>

                <hr className="border-border mb-4" />

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-accent">
                      <span>{t('checkout.discount') || 'Discount'}</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('cart.shipping')}</span>
                    <span className="font-medium">{formatCurrency(shippingCost)}</span>
                  </div>
                </div>

                <hr className="border-border mb-4" />

                <div className="flex justify-between mb-2">
                  <span className="font-semibold">{t('cart.total')}</span>
                  <span className="text-xl font-bold">{formatCurrency(total)}</span>
                </div>

                {hasPartial && (
                  <div className="text-xs text-muted-foreground mb-4 space-y-1">
                    <div className="flex justify-between">
                      <span>Advance payment:</span>
                      <span className="font-medium text-foreground">{formatCurrency(advanceAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due on delivery:</span>
                      <span className="font-medium text-foreground">{formatCurrency(dueOnDelivery)}</span>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="btn-buy-now w-full h-12 text-base font-semibold"
                  disabled={createOrder.isPending}
                >
                  {createOrder.isPending ? t('checkout.processing') : t('checkout.placeOrder')}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
