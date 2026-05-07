import { useSearchParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Button } from '@/components/ui/button';
import { useOrderByNumber } from '@/hooks/useOrders';
import { trackPurchase } from '@/lib/facebook-pixel';

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || 'N/A';
  const { t, settings } = useSiteSettings();
  const { data: order } = useOrderByNumber(orderId);

  useEffect(() => {
    if (order) {
      console.log('[OrderSuccess] Tracking Purchase:', order.order_number);
      trackPurchase({
        orderId: order.order_number,
        value: order.total,
        currency: settings.currency_code,
        contents: order.order_items?.map(item => ({
          id: item.product_id || '',
          quantity: item.quantity,
          item_price: item.price
        })) || [],
        email: order.customer_email || undefined,
        phone: order.customer_phone || undefined,
      });
    }
  }, [order, settings.currency_code]);

  return (
    <Layout>
      <div className="container-shop section-padding">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {t('order.success')}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t('order.orderConfirmation')}
          </p>

          <div className="bg-card rounded-xl border border-border p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Package className="h-6 w-6 text-accent" />
              <span className="font-semibold">{t('order.orderNumber')}</span>
            </div>
            <p className="text-2xl font-bold text-accent">{orderId}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please save this for your records
            </p>
          </div>

          <div className="bg-secondary/50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold mb-4">What's Next?</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                You'll receive an order confirmation via SMS/email
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                Our team will process your order within 24 hours
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                You'll be notified when your order is shipped
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop">
              <Button className="bg-[#e6007e] hover:bg-[#c00069] text-white h-12 px-8 font-semibold rounded-sm">
                {t('cart.continueShopping')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link to="/">
              <Button className="border border-[#e6007e] text-[#e6007e] bg-white hover:bg-[#e6007e]/5 h-12 px-8 font-semibold rounded-sm">
                {t('common.back')} {t('nav.home')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
