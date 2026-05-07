import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFeaturedProducts } from '@/hooks/useShopData';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { ProductCard } from '@/components/products/ProductCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Button } from '@/components/ui/button';
import useEmblaCarousel from 'embla-carousel-react';
import type { HomepageSection } from '@/hooks/useHomepageTemplates';

export function FeaturedProducts({ section }: { section?: HomepageSection }) {
  const { data: products = [], isLoading } = useFeaturedProducts();
  const { t } = useSiteSettings();
  const { ref, isVisible } = useScrollReveal();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps'
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (isLoading) {
    return (
      <section className="section-padding bg-secondary/50">
        <div className="container-shop">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">{section?.title || t('home.featuredProducts')}</h2>
            </div>
          </div>
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-2 md:-ml-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-none w-[50%] sm:w-[33.333%] md:w-[25%] lg:w-[25%] pl-2 md:pl-4">
                  <div className="aspect-product rounded-xl bg-muted animate-pulse h-full" />
                </div>
              ))}
            </div>
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
            <div>
              <h2 className="text-base md:text-xl font-bold whitespace-nowrap">{section?.title || t('home.featuredProducts')}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 md:h-8 md:w-8 flex shrink-0 rounded-full border-border bg-background"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 md:h-8 md:w-8 flex shrink-0 rounded-full border-border bg-background"
              onClick={scrollNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Link
              to="/shop"
              className="ml-2 flex items-center gap-1 text-[11px] md:text-xs font-semibold text-muted-foreground hover:text-accent transition-colors"
            >
              {t('common.viewAll')} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-2 md:-ml-4">
            {products.slice(0, 8).map((product, index) => (
              <div key={product.id} className={`flex-none w-[50%] sm:w-[33.333%] md:w-[25%] lg:w-[25%] pl-2 md:pl-4 reveal-base stagger-${index + 1} ${isVisible ? 'reveal-visible' : ''}`}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
