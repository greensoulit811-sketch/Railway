import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Zap, Loader2, Star, Clock } from 'lucide-react';
import { Product, Category } from '@/hooks/useShopData';
import { useCart } from '@/contexts/CartContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Button } from '@/components/ui/button';
import { WishlistButton } from '@/components/products/WishlistButton';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product & { category?: Category | null };
  isFlashSale?: boolean;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { t, formatCurrency } = useSiteSettings();
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.has_variants) {
      toast.info('Please select size/color options');
      navigate(`/product/${product.slug}`);
      return;
    }

    setIsAddingToCart(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.sale_price ?? undefined,
      image: product.images[0] || '/placeholder.svg',
      quantity: 1,
      stock: product.stock,
    });

    toast.success(t('product.addedToCart'), {
      description: product.name,
    });

    setIsAddingToCart(false);
  };

  const handleBuyNow = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.has_variants) {
      toast.info('Please select size/color options');
      navigate(`/product/${product.slug}`);
      return;
    }

    setIsBuyingNow(true);

    const buyNowItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.sale_price ?? undefined,
      image: product.images[0] || '/placeholder.svg',
      quantity: 1,
      stock: product.stock,
    };

    navigate('/checkout?mode=buynow', { state: { buyNowItem } });
  };

  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.sale_price! / product.price) * 100)
    : 0;

  return (
    <div className="group product-card-flash-sale flex flex-col h-full transition-all duration-300">
      <Link to={`/product/${product.slug}`} className="block flex-1">
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden bg-transparent">
          {/* aspect-square  */}
          <img
            src={product.images[0] || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />

          {/* Flash Sale Badge */}
          <div className="absolute top-2 left-2 z-10">
            {hasDiscount && (
              <span className="flash-sale-badge">
                -{discountPercent}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-3 text-center mt-4">
          <h3 className="text-[14px] md:text-[18px] font-semibold line-clamp-2 mb-2 min-h-[20px] leading-snug">
            {product.name}
          </h3>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="font-bold text-accent text-base md:text-xl">
              ৳{product.sale_price || product.price}
            </span>
            {hasDiscount && (
              <span className="text-base md:text-xl text-muted-foreground line-through">
                ৳{product.price}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="px-2 pb-3 mt-auto flex flex-col gap-1.5">
        <Button
          className="btn-buy-now h-7 md:h-9"
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onClick={handleBuyNow}
          disabled={isBuyingNow || product.stock === 0}
          type="button"
        >
          {isBuyingNow ? <Loader2 className="h-3 w-3 animate-spin" /> : 'অর্ডার করুন'}
        </Button>
        <Button
          className="btn-view h-7 md:h-9 text-primary"
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onClick={handleAddToCart}
          disabled={isAddingToCart || product.stock === 0}
          type="button"
        >
          {isAddingToCart ? <Loader2 className="h-3 w-3 animate-spin" /> : 'যোগ করুন'}
        </Button>
      </div>
    </div>
  );
}
