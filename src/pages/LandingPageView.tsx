import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLandingPage } from '@/hooks/useLandingPages';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useAuth } from '@/hooks/useAuth';
import { useCreateOrder } from '@/hooks/useOrders';
import { useShippingMethods } from '@/hooks/useShippingMethods';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useReviews, Product } from '@/hooks/useShopData';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, ShoppingBag, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';


// Fetch products by IDs
const useLandingProducts = (ids: string[]) => {
  return useQuery({
    queryKey: ['landing_products', ids],
    queryFn: async () => {
      if (!ids.length) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', ids);
      if (error) throw error;
      // Maintain order
      const map = new Map((data || []).map(p => [p.id, p]));
      return ids.map(id => map.get(id)).filter(Boolean) as Product[];
    },
    enabled: ids.length > 0,
  });
};

export default function LandingPageView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: page, isLoading } = useLandingPage(slug || '');
  const { t, formatCurrency, settings } = useSiteSettings();
  const { user } = useAuth();
  const createOrder = useCreateOrder();
  const { data: shippingMethods = [] } = useShippingMethods(true);
  const { data: paymentMethods = [] } = usePaymentMethods(true);
  const { data: reviews = [] } = useReviews(true);
  const { data: products = [] } = useLandingProducts(page?.product_ids || []);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: settings.default_country_name,
    notes: '',
    shippingMethodId: '',
    paymentMethodId: '',
  });
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      setSelectedProduct(products[0]);
    }
  }, [products]);

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
  const effectivePrice = selectedProduct ? (selectedProduct.sale_price ?? selectedProduct.price) : 0;
  const subtotal = effectivePrice * quantity;
  const total = subtotal + shippingCost;

  const selectedPayment = paymentMethods.find(m => m.id === formData.paymentMethodId);
  const hasPartial = selectedPayment?.allow_partial_delivery_payment || false;
  let advanceAmount = 0;
  let dueOnDelivery = total;
  if (hasPartial && selectedPayment) {
    if (selectedPayment.partial_type === 'delivery_charge') advanceAmount = shippingCost;
    else if (selectedPayment.partial_type === 'fixed_amount') advanceAmount = Math.min(selectedPayment.fixed_partial_amount || 0, total);
    dueOnDelivery = total - advanceAmount;
  }
  const requiresTrxId = selectedPayment?.require_transaction_id || false;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const scrollToCheckout = () => {
    document.getElementById('lp-checkout')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city) {
      toast.error(t('validation.fillRequired') || 'Please fill all required fields');
      return;
    }
    if (requiresTrxId && !transactionId.trim()) {
      toast.error('Transaction ID is required');
      return;
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
    const partialSnapshot = hasPartial && selectedPayment ? {
      partial_type: selectedPayment.partial_type,
      fixed_partial_amount: selectedPayment.fixed_partial_amount,
      advance_amount: advanceAmount,
      due_on_delivery: dueOnDelivery,
    } : null;

    try {
      await createOrder.mutateAsync({
        order: {
          order_number: orderNumber,
          user_id: user?.id || null,
          customer_name: formData.fullName,
          customer_phone: formData.phone,
          customer_email: formData.email || null,
          shipping_address: formData.address,
          shipping_city: formData.city,
          shipping_method: selectedShipping?.name || 'Standard',
          shipping_cost: shippingCost,
          payment_method: selectedPayment?.code || 'cod',
          subtotal,
          total,
          status: 'pending',
          notes: formData.notes || null,
          payment_method_id: selectedPayment?.id || null,
          payment_method_name: selectedPayment?.name || 'Cash on Delivery',
          payment_status: hasPartial ? 'partial_paid' : 'unpaid',
          paid_amount: advanceAmount,
          due_amount: dueOnDelivery,
          transaction_id: transactionId.trim() || null,
          partial_rule_snapshot: partialSnapshot,
        },
        items: [{
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          product_image: selectedProduct.images?.[0] || '',
          quantity,
          price: effectivePrice,
          variant_id: null,
          variant_info: null,
        }],
      });
      navigate(`/order-success?orderId=${orderNumber}`);
    } catch (error) {
      // handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-16 w-64" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        className="relative min-h-[60vh] flex items-center justify-center text-center"
        style={{
          backgroundImage: page.hero_image ? `url(${page.hero_image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {page.hero_image && <div className="absolute inset-0 bg-black/50" />}
        <div className="relative z-10 px-4 max-w-3xl mx-auto">
          <h1 className={`text-3xl md:text-5xl font-bold mb-4 ${page.hero_image ? 'text-white' : 'text-foreground'}`}>
            {page.hero_title}
          </h1>
          {page.hero_subtitle && (
            <p className={`text-lg md:text-xl mb-8 ${page.hero_image ? 'text-white/90' : 'text-muted-foreground'}`}>
              {page.hero_subtitle}
            </p>
          )}
          <Button size="lg" className="btn-accent text-lg px-8 py-6" onClick={scrollToCheckout}>
            {page.hero_cta_text}
            <ChevronDown className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{t('common.ourProducts') || t('nav.products') || 'Products'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => {
              const price = product.sale_price ?? product.price;
              const isSelected = selectedProduct?.id === product.id;
              return (
                <div
                  key={product.id}
                  onClick={() => { setSelectedProduct(product); setQuantity(1); }}
                  className={`cursor-pointer bg-card border rounded-xl overflow-hidden transition-all hover:shadow-lg ${
                    isSelected ? 'border-accent ring-2 ring-accent/30' : 'border-border'
                  }`}
                >
                  <div className="aspect-square overflow-hidden">
                    <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-2">{product.name}</h3>
                    {product.short_description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.short_description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-accent">{formatCurrency(price)}</span>
                      {product.sale_price && (
                        <span className="text-sm text-muted-foreground line-through">{formatCurrency(product.price)}</span>
                      )}
                    </div>
                    <Button className="btn-accent w-full mt-3" onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); setQuantity(1); scrollToCheckout(); }}>
                      {page.hero_cta_text}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      {page.how_to_use_cards.length > 0 && (
        <section className="py-12 md:py-16 px-4 bg-secondary/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{t('common.howToUse') || 'How to Use'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {page.how_to_use_cards.map((card, i) => (
                <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                  {card.image && (
                    <div className="aspect-video overflow-hidden">
                      <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">{i + 1}</span>
                      <h3 className="font-semibold">{card.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{card.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button size="lg" className="btn-accent" onClick={scrollToCheckout}>
                {page.hero_cta_text}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Reviews Section */}
      {page.show_reviews && reviews.length > 0 && (
        <section className="py-12 md:py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{t('reviews.title') || 'Customer Reviews'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.slice(0, 6).map(review => (
                <div key={review.id} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{review.text}</p>
                  <p className="text-sm font-semibold">{review.name}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button size="lg" className="btn-accent" onClick={scrollToCheckout}>
                {page.hero_cta_text}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Checkout Section */}
      <section id="lp-checkout" className="py-12 md:py-16 px-4 bg-secondary/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
            <ShoppingBag className="inline h-7 w-7 mr-2" />
            {t('checkout.title') || 'Checkout'}
          </h2>
          {selectedProduct && (
            <p className="text-center text-muted-foreground mb-8">
              {t('common.ordering') || 'Ordering'}: <span className="font-semibold text-foreground">{selectedProduct.name}</span>
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selected Product Summary */}
            {selectedProduct && (
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <img src={selectedProduct.images?.[0]} alt="" className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-semibold">{selectedProduct.name}</p>
                  <p className="text-accent font-bold">{formatCurrency(effectivePrice)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <Button type="button" variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>+</Button>
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-semibold">{t('checkout.contactInfo') || 'Contact Information'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">{t('checkout.fullName') || 'Full Name'} *</label>
                  <Input name="fullName" value={formData.fullName} onChange={handleChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('checkout.phone') || 'Phone'} *</label>
                  <Input name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('checkout.emailOptional') || 'Email'}</label>
                  <Input name="email" type="email" value={formData.email} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-semibold">{t('checkout.shippingAddress') || 'Shipping Address'}</h3>
              <Input name="country" value={formData.country} readOnly className="bg-muted cursor-not-allowed" />
              <div>
                <label className="block text-sm font-medium mb-1">{t('checkout.address') || 'Address'} *</label>
                <Input name="address" value={formData.address} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('checkout.city') || 'City'} *</label>
                <Input name="city" value={formData.city} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('checkout.orderNotes') || 'Notes'}</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} className="input-shop min-h-[80px]" />
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="font-semibold">{t('checkout.shippingMethod') || 'Shipping Method'}</h3>
              {shippingMethods.map(m => (
                <label key={m.id} className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:border-accent transition-colors">
                  <input type="radio" name="shippingMethodId" value={m.id} checked={formData.shippingMethodId === m.id} onChange={handleChange} className="w-4 h-4" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{m.name}</p>
                    {m.estimated_days && <p className="text-xs text-muted-foreground">{m.estimated_days}</p>}
                  </div>
                  <span className="font-semibold text-sm">{formatCurrency(m.base_rate)}</span>
                </label>
              ))}
            </div>

            {/* Payment */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="font-semibold">{t('checkout.paymentMethod') || 'Payment Method'}</h3>
              {paymentMethods.map(pm => (
                <label
                  key={pm.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.paymentMethodId === pm.id ? 'border-accent bg-accent/5' : 'border-border hover:border-accent'
                  }`}
                >
                  <input type="radio" name="paymentMethodId" value={pm.id} checked={formData.paymentMethodId === pm.id} onChange={handleChange} className="w-4 h-4 mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{pm.name}</p>
                    {pm.description && <p className="text-xs text-muted-foreground">{pm.description}</p>}
                    {pm.instructions && formData.paymentMethodId === pm.id && (
                      <div className="mt-2 p-2 bg-secondary/50 rounded text-xs text-muted-foreground">{pm.instructions}</div>
                    )}
                  </div>
                </label>
              ))}

              {requiresTrxId && (
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">Transaction ID *</label>
                  <Input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="Enter transaction/reference ID" required />
                </div>
              )}

              {hasPartial && (
                <div className="mt-3 p-3 border border-accent/30 bg-accent/5 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between"><span>Pay now:</span><span className="font-semibold">{formatCurrency(advanceAmount)}</span></div>
                  <div className="flex justify-between"><span>Pay on delivery:</span><span className="font-semibold">{formatCurrency(dueOnDelivery)}</span></div>
                </div>
              )}
            </div>

            {/* Order Total */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('cart.subtotal') || 'Subtotal'}</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('cart.shipping') || 'Shipping'}</span>
                <span className="font-medium">{formatCurrency(shippingCost)}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between">
                <span className="font-semibold">{t('cart.total') || 'Total'}</span>
                <span className="text-xl font-bold text-accent">{formatCurrency(total)}</span>
              </div>
            </div>

            <Button type="submit" size="lg" className="btn-accent w-full text-lg py-6" disabled={createOrder.isPending || !selectedProduct}>
              {createOrder.isPending ? (t('checkout.processing') || 'Processing...') : (page.hero_cta_text || t('checkout.placeOrder') || 'Place Order')}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
