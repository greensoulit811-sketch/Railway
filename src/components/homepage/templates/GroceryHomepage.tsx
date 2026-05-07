import { Layout } from '@/components/layout/Layout';
import { useCategories, useFeaturedProducts, useNewArrivals, useBestSellers } from '@/hooks/useShopData';
import { ProductCard } from '@/components/products/ProductCard';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Clock, ShieldCheck, Zap } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { HomepageSection } from '@/hooks/useHomepageTemplates';
import { useState, useEffect } from 'react';

function CategoryIconsSection({ section }: { section: HomepageSection }) {
  const { data: categories = [] } = useCategories();
  const { ref, isVisible } = useScrollReveal();
  return (
    <section className="py-8 bg-gradient-to-b from-green-50 to-background" ref={ref}>
      <div className="container-shop">
        <h2 className={`text-xl font-bold mb-6 text-center reveal-base ${isVisible ? 'reveal-visible' : ''}`}>
          {section.title}
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {categories.slice(0, 12).map((cat, i) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl bg-card border hover:border-green-400 hover:shadow-md transition-all reveal-base stagger-${i + 1} ${isVisible ? 'reveal-visible' : ''}`}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden bg-green-100">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-xs font-medium text-center line-clamp-2">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FlashSaleSection({ section }: { section: HomepageSection }) {
  const { data: products = [] } = useFeaturedProducts();
  const { ref, isVisible } = useScrollReveal();
  const countdownHours = section.settings_json?.countdown_hours || 24;
  const [timeLeft, setTimeLeft] = useState(countdownHours * 3600);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  if (products.length === 0) return null;

  return (
    <section className="py-10 bg-gradient-to-r from-red-50 to-orange-50" ref={ref}>
      <div className="container-shop">
        <div className={`flex items-center justify-between mb-6 reveal-left ${isVisible ? 'reveal-visible' : ''}`}>
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-red-500" />
            <h2 className="text-xl font-bold">{section.title}</h2>
          </div>
          <div className="flex gap-2 text-sm font-mono">
            <span className="bg-red-500 text-white px-2 py-1 rounded">{String(hours).padStart(2, '0')}h</span>
            <span className="bg-red-500 text-white px-2 py-1 rounded">{String(minutes).padStart(2, '0')}m</span>
            <span className="bg-red-500 text-white px-2 py-1 rounded">{String(seconds).padStart(2, '0')}s</span>
          </div>
        </div>
        <div className="product-grid">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DeliveryStripSection({ section }: { section: HomepageSection }) {
  return (
    <section className="py-6 bg-green-600 text-white">
      <div className="container-shop">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <Truck className="h-6 w-6" />
            <span className="text-sm font-medium">Fast Delivery</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Clock className="h-6 w-6" />
            <span className="text-sm font-medium">Same Day Available</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            <span className="text-sm font-medium">Fresh Guaranteed</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Zap className="h-6 w-6" />
            <span className="text-sm font-medium">Best Prices</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductGridSection({ section }: { section: HomepageSection }) {
  const { data: products = [] } = useNewArrivals();
  const { ref, isVisible } = useScrollReveal();
  if (products.length === 0) return null;
  return (
    <section className="section-padding" ref={ref}>
      <div className="container-shop">
        <div className={`flex items-center justify-between mb-6 reveal-left ${isVisible ? 'reveal-visible' : ''}`}>
          <h2 className="text-xl font-bold">{section.title}</h2>
          <Link to="/shop" className="text-sm text-green-600 font-medium flex items-center gap-1 hover:underline">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="product-grid">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ComboOffersSection({ section }: { section: HomepageSection }) {
  const { data: products = [] } = useBestSellers();
  const { ref, isVisible } = useScrollReveal();
  if (products.length === 0) return null;
  return (
    <section className="section-padding bg-yellow-50" ref={ref}>
      <div className="container-shop">
        <h2 className={`text-xl font-bold mb-6 text-center reveal-base ${isVisible ? 'reveal-visible' : ''}`}>
          {section.title}
        </h2>
        <div className="product-grid">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

const GROCERY_SECTIONS: Record<string, React.ComponentType<{ section: HomepageSection }>> = {
  category_icons: CategoryIconsSection,
  flash_sale: FlashSaleSection,
  product_grid: ProductGridSection,
  combo_offers: ComboOffersSection,
  delivery_strip: DeliveryStripSection,
};

export function GroceryHomepage({ sections }: { sections: HomepageSection[] }) {
  return (
    <Layout>
      {sections.map((section) => {
        const Component = GROCERY_SECTIONS[section.section_type];
        if (Component) return <Component key={section.id} section={section} />;
        return null;
      })}
    </Layout>
  );
}
