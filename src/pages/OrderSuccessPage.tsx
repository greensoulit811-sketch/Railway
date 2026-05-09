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
    if (order && settings) {
      console.log('[Purchase Event] Triggering for order:', order.order_number);
      console.log('[Purchase Event] Using Pixel ID:', settings.fb_pixel_id);
      
      const timer = setTimeout(() => {
        trackPurchase({
          transaction_id: order.order_number,
          value: parseFloat(order.total_amount),
          currency: settings.currency_code || 'BDT',
          items: order.items?.map((item: any) => ({
            id: item.sku || item.product_id,
            name: item.product_name,
            quantity: item.quantity,
            price: parseFloat(item.price)
          })) || []
        });
        console.log('[Purchase Event] Sent to Facebook');
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [order, settings]);

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
