import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/useShopData';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ArrowRight } from 'lucide-react';
import type { HomepageSection } from '@/hooks/useHomepageTemplates';

export function FeaturedCategories({ section }: { section?: HomepageSection }) {
  const { data: categories = [], isLoading } = useCategories();
  const { t } = useSiteSettings();
  const { ref: sectionRef, isVisible } = useScrollReveal();

  if (isLoading) {
    return (
      <section className="section-padding">
        <div className="container-shop">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">{section?.title || t('home.shopByCategory')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const categoryConfigs = [
    { name: 'OFFICE BAG', color: '#4b68e1' },
    { name: 'GIFT ACCESSORIES', color: '#cb9e56' },
    { name: 'LADIES BAG', color: '#88af4a' },
    { name: 'GENTS ITEMS', color: '#8c5d3b' },
    { name: 'JACKET', color: '#2b71ae' },
    { name: 'TRAVEL BAG', color: '#b22222' },
    { name: 'GENTS ITEMS', color: '#00a86b' },
    { name: 'SHOES', color: '#990000' },
    { name: 'WALLET', color: '#d2691e' },
    { name: 'BELT', color: '#ff4500' },
  ];

  return (
    <section className="py-10 md:py-16 bg-white" ref={sectionRef}>
      <div className="container-shop">
        <div className={`flex items-center justify-between mb-8 reveal-left ${isVisible ? 'reveal-visible' : ''}`}>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">{section?.title || t('home.shopByCategory')}</h2>
          </div>
          <Link
            to="/categories"
            className="flex items-center gap-1 text-[11px] md:text-sm font-semibold text-muted-foreground hover:text-accent transition-colors"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-6">
          {categories.slice(0, 10).map((category, index) => (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className={`category-card group reveal-scale stagger-${index + 1} ${isVisible ? 'reveal-visible' : ''}`}
            >
              <img
                src={category.image}
                alt={category.name}
                className="category-card-img"
              />
              <div className="category-card-overlay" />
              <div className="category-card-content">
                <h3 className="category-card-title">{category.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
