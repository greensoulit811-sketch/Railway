import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Minus, Plus, ShoppingBag, Zap, Loader2, MessageCircle, Star, Package, Shield, Truck } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { VariantSelector } from '@/components/products/VariantSelector';
import { WishlistButton } from '@/components/products/WishlistButton';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ReviewList } from '@/components/reviews/ReviewList';
import { useProduct, useRelatedProducts } from '@/hooks/useShopData';
import { useProductVariants, ProductVariant } from '@/hooks/useVariants';
import { useProductReviews } from '@/hooks/useProductReviews';
import { useCart } from '@/contexts/CartContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { trackViewContent, trackAddToCart } from '@/lib/facebook-pixel';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStoreSettings } from '@/hooks/useStoreSettings';

export default function ProductDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { t, formatCurrency, settings } = useSiteSettings();
  const { data: product, isLoading } = useProduct(slug || '');
  const { data: relatedProducts = [] } = useRelatedProducts(product);
  const { data: variants = [] } = useProductVariants(product?.id || '');
  const { data: reviews = [] } = useProductReviews(product?.id || '', true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const isMobile = useIsMobile();
  const { data: storeSettings } = useStoreSettings();

  const whatsappEnabled = storeSettings?.whatsapp_order_enabled === 'true' && !!storeSettings?.whatsapp_number;

  // Track ViewContent when product loads
  useEffect(() => {
    if (product) {
      trackViewContent({
        contentId: product.id,
        contentName: product.name,
        value: product.sale_price || product.price,
        currency: settings.currency_code,
      });
    }
  }, [product, settings.currency_code]);

  // Auto-select first available variant
  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      const availableVariant = variants.find(v => v.is_active && v.stock > 0);
      if (availableVariant) setSelectedVariant(availableVariant);
    }
  }, [variants, selectedVariant]);

  // Calculate effective price and stock based on selected variant
  const effectivePrice = useMemo(() => {
    if (selectedVariant) {
      if (selectedVariant.variant_sale_price != null) {
        return selectedVariant.variant_sale_price;
      }
      if (selectedVariant.variant_price != null) {
        return selectedVariant.variant_price;
      }
    }
    return product?.sale_price || product?.price || 0;
  }, [product, selectedVariant]);

  const effectiveStock = selectedVariant?.stock ?? product?.stock ?? 0;
  const hasVariants = variants.length > 0 && (product as any)?.is_variable;

  // Average rating
  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container-shop section-padding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            <div className="space-y-4">
              <div className="aspect-square rounded-2xl bg-muted animate-pulse" />
              <div className="flex gap-3">
                {[1,2,3].map(i => <div key={i} className="w-20 h-20 rounded-xl bg-muted animate-pulse" />)}
              </div>
            </div>
            <div className="space-y-5">
              <div className="h-5 bg-muted rounded animate-pulse w-1/4" />
              <div className="h-10 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-8 bg-muted rounded animate-pulse w-1/3" />
              <div className="h-px bg-border" />
              <div className="h-20 bg-muted rounded animate-pulse" />
              <div className="h-12 bg-muted rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container-shop section-padding text-center py-20">
          <h1 className="text-2xl font-bold mb-4">{t('common.noResults')}</h1>
          <Link to="/shop" className="text-primary hover:underline font-medium">
            {t('cart.continueShopping')}
          </Link>
        </div>
      </Layout>
    );
  }

  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.sale_price!) / product.price) * 100) : 0;

  const handleAddToCart = async () => {
    if (hasVariants && !selectedVariant) {
      toast.error('Please select size/color');
      return;
    }
    
    setIsAddingToCart(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    addItem({
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
      name: selectedVariant
        ? `${product.name} (${[selectedVariant.size, selectedColor || selectedVariant.color].filter(Boolean).join(' / ')})`
        : product.name,
      price: selectedVariant?.variant_price != null ? selectedVariant.variant_price : product.price,
      salePrice: selectedVariant?.variant_sale_price != null
        ? selectedVariant.variant_sale_price
        : selectedVariant?.variant_price != null
        ? undefined
        : product.sale_price || undefined,
      image: product.images[0] || '/placeholder.svg',
      quantity,
      stock: effectiveStock,
      variantId: selectedVariant?.id,
      variantInfo: selectedVariant
        ? { size: selectedVariant.size, color: selectedColor || selectedVariant.color }
        : undefined,
    });
    
    trackAddToCart({
      contentId: product.id,
      contentName: product.name,
      value: effectivePrice * quantity,
      currency: settings.currency_code,
      quantity,
    });
    
    toast.success(t('product.addedToCart'), {
      description: `${quantity}x ${product.name}`,
    });
    
    setIsAddingToCart(false);
  };

  const handleBuyNow = async () => {
    if (hasVariants && !selectedVariant) {
      toast.error('Please select size/color');
      return;
    }
    
    setIsBuyingNow(true);
    
    const buyNowItem = {
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
      name: selectedVariant
        ? `${product.name} (${[selectedVariant.size, selectedColor || selectedVariant.color].filter(Boolean).join(' / ')})`
        : product.name,
      price: selectedVariant?.variant_price != null ? selectedVariant.variant_price : product.price,
      salePrice: selectedVariant?.variant_sale_price != null
        ? selectedVariant.variant_sale_price
        : selectedVariant?.variant_price != null
        ? undefined
        : product.sale_price || undefined,
      image: product.images[0] || '/placeholder.svg',
      quantity,
      stock: effectiveStock,
      variantId: selectedVariant?.id,
      variantInfo: selectedVariant
        ? { size: selectedVariant.size, color: selectedColor || selectedVariant.color }
        : undefined,
    };
    
    trackAddToCart({
      contentId: product.id,
      contentName: product.name,
      value: effectivePrice * quantity,
      currency: settings.currency_code,
      quantity,
    });
    
    navigate('/checkout?mode=buynow', { state: { buyNowItem } });
  };

  return (
    <Layout>
      <div className={`container-shop section-padding ${isMobile ? 'pb-24' : ''}`}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8 flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors">{t('nav.home')}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/shop" className="hover:text-foreground transition-colors">{t('nav.shop')}</Link>
          {product.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link to={`/category/${product.category.slug}`} className="hover:text-foreground transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground/70 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Gallery */}
          <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            {/* Main Image */}
            <div
              className="aspect-square rounded-2xl overflow-hidden bg-secondary/40 group cursor-zoom-in relative border border-border/40"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                const img = e.currentTarget.querySelector('img');
                if (img) {
                  img.style.transformOrigin = `${x}% ${y}%`;
                }
              }}
            >
              {/* Discount badge */}
              {hasDiscount && (
                <div className="absolute top-4 left-4 z-10 bg-destructive text-destructive-foreground px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm">
                  -{discountPercent}%
                </div>
              )}
              <img
                src={product.images[selectedImage] || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.8]"
              />
            </div>
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-[72px] h-[72px] shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      selectedImage === index
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border/50 hover:border-primary/40'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  {product.category && (
                    <Link 
                      to={`/category/${product.category.slug}`}
                      className="inline-block text-xs text-primary/80 uppercase tracking-[0.15em] font-semibold hover:text-primary transition-colors"
                    >
                      {product.category.name}
                    </Link>
                  )}
                  <h1 className="text-2xl md:text-3xl lg:text-[2.25rem] font-bold leading-tight text-foreground">
                    {product.name}
                  </h1>
                </div>
                <WishlistButton productId={product.id} size="md" />
              </div>

              {/* Rating summary */}
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(star => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-border'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-foreground">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3 mt-4">
                {selectedVariant?.variant_price != null ? (
                  selectedVariant.variant_sale_price != null && selectedVariant.variant_sale_price < selectedVariant.variant_price ? (
                    <>
                      <span className="text-3xl md:text-4xl font-extrabold text-foreground">
                        {formatCurrency(selectedVariant.variant_sale_price)}
                      </span>
                      <span className="text-lg text-muted-foreground/70 line-through font-medium">
                        {formatCurrency(selectedVariant.variant_price)}
                      </span>
                      <span className="bg-destructive/10 text-destructive px-2.5 py-1 text-xs font-bold rounded-md">
                        Save {formatCurrency(selectedVariant.variant_price - selectedVariant.variant_sale_price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl md:text-4xl font-extrabold text-foreground">
                      {formatCurrency(selectedVariant.variant_price)}
                    </span>
                  )
                ) : hasDiscount ? (
                  <>
                    <span className="text-3xl md:text-4xl font-extrabold text-foreground">
                      {formatCurrency(product.sale_price!)}
                    </span>
                    <span className="text-lg text-muted-foreground/70 line-through font-medium">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="bg-destructive/10 text-destructive px-2.5 py-1 text-xs font-bold rounded-md">
                      Save {formatCurrency(product.price - product.sale_price!)}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl md:text-4xl font-extrabold text-foreground">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Short Description */}
            {product.short_description && (
              <p className="text-muted-foreground text-[0.938rem] leading-relaxed">{product.short_description}</p>
            )}

            {/* Variant Selector */}
            {hasVariants && (
              <VariantSelector
                variants={variants.filter(v => v.is_active)}
                selectedVariant={selectedVariant}
                onSelect={setSelectedVariant}
                onColorSelect={setSelectedColor}
              />
            )}

            {/* Stock */}
            {settings.show_stock_to_visitors && !(product as any)?.hide_stock && (
              <div className="flex items-center gap-2">
                {effectiveStock > 0 ? (
                  <>
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-semibold text-emerald-600">{t('product.inStock')}</span>
                    <span className="text-sm text-muted-foreground">
                      — {effectiveStock} available
                    </span>
                  </>
                ) : (
                  <>
                    <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
                    <span className="text-sm font-semibold text-destructive">{t('product.outOfStock')}</span>
                  </>
                )}
              </div>
            )}

            {/* Quantity + Actions */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2.5 block text-foreground/80">{t('product.quantity')}</label>
                <div className="inline-flex items-center border border-border rounded-xl overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-none hover:bg-secondary"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="h-11 w-14 flex items-center justify-center text-base font-semibold border-x border-border">
                    {quantity}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-none hover:bg-secondary"
                    onClick={() => setQuantity(Math.min(effectiveStock, quantity + 1))}
                    disabled={quantity >= effectiveStock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Desktop Actions */}
              <div className="hidden md:flex flex-col gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-12 rounded-lg font-medium text-sm border-border hover:border-primary hover:bg-primary/5 transition-all gap-2"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || effectiveStock === 0 || (hasVariants && !selectedVariant)}
                >
                  {isAddingToCart ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ShoppingBag className="h-5 w-5" />
                  )}
                  {t('product.addToCart')}
                </Button>
                <Button
                  size="lg"
                  className="btn-buy-now w-full h-12 rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all gap-2"
                  onClick={handleBuyNow}
                  disabled={isBuyingNow || effectiveStock === 0 || (hasVariants && !selectedVariant)}
                >
                  {isBuyingNow ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Zap className="h-5 w-5" />
                  )}
                  {t('product.buyNow')}
                </Button>
              </div>

              {/* WhatsApp Order Button */}
              {whatsappEnabled && (
                <a
                  href={`https://wa.me/${storeSettings!.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I want to order:\n\n*${product.name}*\nPrice: ${formatCurrency(effectivePrice)}\nQuantity: ${quantity}${selectedVariant ? `\nVariant: ${[selectedVariant.size, selectedVariant.color].filter(Boolean).join(' / ')}` : ''}\n\nPlease confirm my order.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:flex items-center justify-center gap-3 w-full py-3.5 px-6 bg-[#25D366] hover:bg-[#1fb855] text-white rounded-xl font-semibold transition-colors shadow-sm"
                >
                  <MessageCircle className="h-5 w-5" />
                  Order on WhatsApp
                </a>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 py-1">
              <div className="flex flex-col items-center text-center gap-2 p-3 rounded-xl bg-secondary/40">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground leading-tight">Fast Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 p-3 rounded-xl bg-secondary/40">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground leading-tight">Secure Payment</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 p-3 rounded-xl bg-secondary/40">
                <Package className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground leading-tight">Quality Assured</span>
              </div>
            </div>

            {/* SKU */}
            <p className="text-xs text-muted-foreground/60 tracking-wide font-medium">
              {t('product.sku')}: {product.sku}
            </p>

            <div className="h-px bg-border" />

            {/* Description & Specs & Reviews */}
            <Accordion type="single" collapsible defaultValue="description" className="space-y-2">
              <AccordionItem value="description" className="border border-border/60 rounded-xl overflow-hidden">
                <AccordionTrigger className="px-5 py-4 text-sm font-bold uppercase tracking-wider hover:no-underline hover:bg-secondary/30 transition-colors">
                  {t('product.description')}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <div className="text-muted-foreground text-[0.938rem] leading-[1.75] whitespace-pre-line">
                    {product.description || 'No description available.'}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {(product as any).specifications && Array.isArray((product as any).specifications) && (product as any).specifications.length > 0 && (
                <AccordionItem value="specifications" className="border border-border/60 rounded-xl overflow-hidden">
                  <AccordionTrigger className="px-5 py-4 text-sm font-bold uppercase tracking-wider hover:no-underline hover:bg-secondary/30 transition-colors">
                    SPECIFICATIONS
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5">
                    <div className="rounded-lg overflow-hidden border border-border/40">
                      <table className="w-full text-sm">
                        <tbody>
                          {((product as any).specifications as { label: string; value: string }[]).map((spec, i) => (
                            <tr key={i} className={`${i % 2 === 0 ? 'bg-secondary/30' : 'bg-background'} ${i > 0 ? 'border-t border-border/30' : ''}`}>
                              <td className="py-2.5 px-4 font-semibold text-foreground w-2/5">{spec.label}</td>
                              <td className="py-2.5 px-4 text-muted-foreground">{spec.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="reviews" className="border border-border/60 rounded-xl overflow-hidden">
                <AccordionTrigger className="px-5 py-4 text-sm font-bold uppercase tracking-wider hover:no-underline hover:bg-secondary/30 transition-colors">
                  REVIEWS ({reviews.length})
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <div className="mb-5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg font-medium"
                      onClick={() => setShowReviewForm(!showReviewForm)}
                    >
                      {showReviewForm ? 'Cancel' : 'Write a Review'}
                    </Button>
                  </div>
                  {showReviewForm && (
                    <div className="bg-secondary/40 rounded-xl p-5 mb-5 border border-border/40">
                      <ReviewForm
                        productId={product.id}
                        productName={product.name}
                        onSuccess={() => setShowReviewForm(false)}
                      />
                    </div>
                  )}
                  <ReviewList reviews={reviews} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-border">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">{t('product.relatedProducts')}</h2>
              <Link to="/shop" className="text-sm font-medium text-primary hover:underline">View All</Link>
            </div>
            <div className="product-grid">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile Sticky Action Bar */}
      {isMobile && product && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
          <div className="flex flex-col gap-2 max-w-7xl mx-auto">
            <Button
              variant="outline"
              className="w-full h-11 text-sm font-medium rounded-lg border-border hover:border-primary gap-2"
              onClick={handleAddToCart}
              disabled={isAddingToCart || effectiveStock === 0 || (hasVariants && !selectedVariant)}
              aria-label={t('product.addToCart')}
            >
              {isAddingToCart ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ShoppingBag className="h-5 w-5" />
              )}
              {t('product.addToCart')}
            </Button>
            <Button
              className="btn-buy-now w-full h-11 text-sm font-semibold rounded-lg shadow-sm gap-2"
              onClick={handleBuyNow}
              disabled={isBuyingNow || effectiveStock === 0 || (hasVariants && !selectedVariant)}
              aria-label={t('product.buyNow')}
            >
              {isBuyingNow ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
              {t('product.buyNow')}
            </Button>
            {whatsappEnabled && (
              <a
                href={`https://wa.me/${storeSettings!.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I want to order:\n\n*${product.name}*\nPrice: ${formatCurrency(effectivePrice)}\nQuantity: ${quantity}${selectedVariant ? `\nVariant: ${[selectedVariant.size, selectedVariant.color].filter(Boolean).join(' / ')}` : ''}\n\nPlease confirm my order.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 w-12 shrink-0 flex items-center justify-center bg-[#25D366] hover:bg-[#1fb855] text-white rounded-xl transition-colors"
                aria-label="Order on WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
