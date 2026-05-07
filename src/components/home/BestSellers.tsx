import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { useBestSellers } from '@/hooks/useShopData';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { ProductCard } from '@/components/products/ProductCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { HomepageSection } from '@/hooks/useHomepageTemplates';

export function BestSellers({ section }: { section?: HomepageSection }) {
  const { data: products = [], isLoading } = useBestSellers();
  const { t } = useSiteSettings();
  const { ref, isVisible } = useScrollReveal();

  if (isLoading) {
    return (
      <section className="py-6 md:py-8">
        <div className="container-shop">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg md:text-xl font-bold">{section?.title || t('home.bestsellers')}</h2>
            </div>
          </div>
          <div className="product-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square rounded shadow-sm bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-6 md:py-8" ref={ref}>
      <div className="container-shop">
        <div className={`flex items-center justify-between mb-4 reveal-left ${isVisible ? 'reveal-visible' : ''}`}>
          <div className="flex items-center gap-2 md:gap-4">
            <h2 className="text-base md:text-xl font-bold whitespace-nowrap">{section?.title || t('home.bestSellers')}</h2>
          </div>
          <Link
            to="/shop?filter=bestsellers"
            className="flex items-center gap-1 text-[11px] md:text-xs font-semibold text-muted-foreground hover:text-accent transition-colors"
          >
            {t('common.viewAll')} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2 md:gap-4">
          {products.slice(0, 8).map((product, index) => (
            <div key={product.id} className={`reveal-base stagger-${index + 1} ${isVisible ? 'reveal-visible' : ''}`}>
              <ProductCard product={product} isFlashSale />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
