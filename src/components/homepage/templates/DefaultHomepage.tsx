import { Layout } from '@/components/layout/Layout';
import { HeroSlider } from '@/components/home/HeroSlider';
import { FeaturedCategories } from '@/components/home/FeaturedCategories';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { BestSellers } from '@/components/home/BestSellers';

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useNewArrivals } from '@/hooks/useShopData';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { ProductCard } from '@/components/products/ProductCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { HomepageSection } from '@/hooks/useHomepageTemplates';

const SECTION_COMPONENTS: Record<string, React.ComponentType<{ section: HomepageSection }>> = {
  hero_slider: ({ section }) => <HeroSlider />, // HeroSlider doesn't use section title yet
  featured_categories: ({ section }) => <FeaturedCategories section={section} />,
  featured_products: ({ section }) => <FeaturedProducts section={section} />,
  best_sellers: ({ section }) => <BestSellers section={section} />,
  
};

function NewArrivalsSection({ section }: { section: HomepageSection }) {
  const { data: newArrivals = [] } = useNewArrivals();
  const { ref, isVisible } = useScrollReveal();
  const { t } = useSiteSettings();

  if (newArrivals.length === 0) return null;

  return (
    <section className="py-6 md:py-8" ref={ref}>
      <div className="container-shop">
        <div className={`flex items-center justify-between mb-4 reveal-left ${isVisible ? 'reveal-visible' : ''}`}>
          <div className="flex items-center gap-2 md:gap-4">
            <div>
              <h2 className="text-base md:text-xl font-bold whitespace-nowrap">{section?.title || 'প্রিমিয়াম কোয়ালিটি শুটকি'}</h2>
            </div>
          </div>
          <Link
            to="/shop?filter=new"
            className="flex items-center gap-1 text-[11px] md:text-xs font-semibold text-muted-foreground hover:text-accent transition-colors"
          >
            {t('common.viewAll')} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2 md:gap-4">
          {newArrivals.slice(0, 8).map((product, index) => (
            <div key={product.id} className={`reveal-base stagger-${index + 1} ${isVisible ? 'reveal-visible' : ''}`}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DefaultHomepage({ sections }: { sections: HomepageSection[] }) {
  return (
    <Layout>
      {sections.map((section) => {
        if (section.section_type === 'new_arrivals') {
          return <NewArrivalsSection key={section.id} section={section} />;
        }
        const Component = SECTION_COMPONENTS[section.section_type];
        if (Component) return <Component key={section.id} section={section} />;
        return null;
      })}
    </Layout>
  );
}
