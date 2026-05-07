import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Button } from '@/components/ui/button';

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart();
  const { t, formatCurrency } = useSiteSettings();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container-shop section-padding text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('cart.emptyCart')}</h1>
          <p className="text-muted-foreground mb-8">
            {t('cart.emptyCart')}
          </p>
          <Link to="/shop">
            <Button className="btn-accent">
              {t('cart.continueShopping')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-shop section-padding">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">{t('cart.title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const price = item.salePrice ?? item.price;
              return (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-card rounded-xl border border-border"
                >
                  {/* Image */}
                  <Link
                    to={`/product/${item.id}`}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-secondary shrink-0"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.id}`}
                      className="font-medium hover:text-accent transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold">{formatCurrency(price)}</span>
                      {item.salePrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(item.price)}
                        </span>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Subtotal & Remove */}
                  <div className="flex flex-col items-end justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <span className="font-bold">
                      {formatCurrency(price * item.quantity)}
                    </span>
                  </div>
                </div>
              );
            })}

            <Button variant="outline" onClick={clearCart} className="mt-4">
              {t('common.clear')} {t('common.cart')}
            </Button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">{t('checkout.orderSummary')}</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('cart.shipping')}</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    className="input-shop flex-1 text-sm"
                  />
                  <Button variant="outline" size="sm">
                    Apply
                  </Button>
                </div>
              </div>

              <hr className="border-border mb-4" />

              <div className="flex justify-between mb-6">
                <span className="font-semibold">{t('cart.total')}</span>
                <span className="text-xl font-bold">{formatCurrency(subtotal)}</span>
              </div>

              <Link to="/checkout">
                <Button size="lg" className="btn-buy-now w-full h-12 text-sm md:text-base">
                  {t('cart.proceedToCheckout')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>

              <Link to="/shop">
                <Button variant="link" className="w-full mt-4">
                  {t('cart.continueShopping')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
