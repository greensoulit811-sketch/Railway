import { Layout } from '@/components/layout/Layout';
import { useFeaturedProducts, useBestSellers, useNewArrivals, useCategories } from '@/hooks/useShopData';
import { ProductCard } from '@/components/products/ProductCard';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Headphones, Wrench, Cpu } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { HomepageSection } from '@/hooks/useHomepageTemplates';

function FeaturedHeroSection({ section }: { section: HomepageSection }) {
  const { data: products = [] } = useFeaturedProducts();
  const featured = products[0];

  return (
    <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white py-16">
      <div className="container-shop">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{section.title}</h1>
            {featured && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">{featured.name}</h2>
                <p className="text-slate-400 text-sm line-clamp-2">{featured.short_description}</p>
                <Link
                  to={`/product/${featured.slug}`}
                  className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  View Details <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
          {featured?.images?.[0] && (
            <div className="flex justify-center">
              <img
                src={featured.images[0]}
                alt={featured.name}
                className="max-h-[350px] object-contain drop-shadow-2xl"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function HotDealsSection({ section }: { section: HomepageSection }) {
  const { data: products = [] } = useNewArrivals();
  const { ref, isVisible } = useScrollReveal();
  if (products.length === 0) return null;

  return (
    <section className="section-padding" ref={ref}>
      <div className="container-shop">
        <div className={`flex items-center justify-between mb-6 reveal-left ${isVisible ? 'reveal-visible' : ''}`}>
          <h2 className="text-xl font-bold">{section.title}</h2>
          <Link to="/shop" className="text-sm text-blue-600 font-medium flex items-center gap-1">
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

function ShopByBrandSection({ section }: { section: HomepageSection }) {
  const { data: categories = [] } = useCategories();
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-10 bg-slate-50" ref={ref}>
      <div className="container-shop">
        <h2 className={`text-xl font-bold mb-6 text-center reveal-base ${isVisible ? 'reveal-visible' : ''}`}>
          {section.title}
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {categories.slice(0, 6).map((cat, i) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className={`flex flex-col items-center gap-2 p-4 bg-card rounded-xl border hover:border-blue-400 hover:shadow-md transition-all reveal-base stagger-${i + 1} ${isVisible ? 'reveal-visible' : ''}`}
            >
              <img src={cat.image} alt={cat.name} className="h-16 w-16 object-contain" />
              <span className="text-xs font-medium text-center">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonSection({ section }: { section: HomepageSection }) {
  const { data: products = [] } = useBestSellers();
  const { ref, isVisible } = useScrollReveal();
  if (products.length < 2) return null;

  return (
    <section className="section-padding" ref={ref}>
      <div className="container-shop">
        <h2 className={`text-xl font-bold mb-6 text-center reveal-base ${isVisible ? 'reveal-visible' : ''}`}>
          {section.title}
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {products.slice(0, 2).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WarrantyStripSection({ section }: { section: HomepageSection }) {
  return (
    <section className="py-6 bg-blue-600 text-white">
      <div className="container-shop">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            <span className="text-sm font-medium">Official Warranty</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Headphones className="h-6 w-6" />
            <span className="text-sm font-medium">24/7 Support</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Wrench className="h-6 w-6" />
            <span className="text-sm font-medium">Service Center</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Cpu className="h-6 w-6" />
            <span className="text-sm font-medium">Genuine Products</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const GADGETS_SECTIONS: Record<string, React.ComponentType<{ section: HomepageSection }>> = {
  featured_hero: FeaturedHeroSection,
  hot_deals: HotDealsSection,
  shop_by_brand: ShopByBrandSection,
  comparison_block: ComparisonSection,
  warranty_strip: WarrantyStripSection,
};

export function GadgetsHomepage({ sections }: { sections: HomepageSection[] }) {
  return (
    <Layout>
      {sections.map((section) => {
        const Component = GADGETS_SECTIONS[section.section_type];
        if (Component) return <Component key={section.id} section={section} />;
        return null;
      })}
    </Layout>
  );
}
