import { Layout } from '@/components/layout/Layout';
import { useFeaturedProducts, useBestSellers, useCategories } from '@/hooks/useShopData';
import { ProductCard } from '@/components/products/ProductCard';

import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Droplets, Heart, Leaf } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { HomepageSection } from '@/hooks/useHomepageTemplates';

function HeroBannerSection({ section }: { section: HomepageSection }) {
  return (
    <section className="relative h-[500px] bg-gradient-to-r from-pink-100 via-rose-50 to-purple-100 flex items-center">
      <div className="container-shop relative z-10">
        <div className="max-w-lg">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{section.title}</h1>
          <Link to="/shop" className="inline-flex items-center gap-2 bg-pink-600 text-white px-8 py-3 rounded-full font-medium hover:bg-pink-700 transition-colors">
            Shop Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ShopByConcernSection({ section }: { section: HomepageSection }) {
  const concerns = [
    { icon: Sparkles, label: 'Anti-Aging', color: 'bg-purple-100 text-purple-600' },
    { icon: Droplets, label: 'Hydration', color: 'bg-blue-100 text-blue-600' },
    { icon: Heart, label: 'Acne Care', color: 'bg-red-100 text-red-600' },
    { icon: Leaf, label: 'Natural', color: 'bg-green-100 text-green-600' },
  ];
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="section-padding" ref={ref}>
      <div className="container-shop">
        <h2 className={`text-2xl font-bold text-center mb-8 reveal-base ${isVisible ? 'reveal-visible' : ''}`}>
          {section.title}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {concerns.map((c, i) => (
            <Link
              key={c.label}
              to="/shop"
              className={`flex flex-col items-center gap-3 p-6 rounded-2xl border hover:shadow-lg transition-all reveal-base stagger-${i + 1} ${isVisible ? 'reveal-visible' : ''}`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${c.color}`}>
                <c.icon className="h-7 w-7" />
              </div>
              <span className="font-medium">{c.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function BrandSliderSection({ section }: { section: HomepageSection }) {
  const { data: categories = [] } = useCategories();
  const { ref, isVisible } = useScrollReveal();
  return (
    <section className="py-10 bg-rose-50" ref={ref}>
      <div className="container-shop">
        <h2 className={`text-xl font-bold mb-6 text-center reveal-base ${isVisible ? 'reveal-visible' : ''}`}>
          {section.title}
        </h2>
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="shrink-0 w-28 h-28 rounded-full overflow-hidden border-2 border-pink-200 hover:border-pink-400 transition-all"
            >
              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function BestSellersSection({ section }: { section: HomepageSection }) {
  const { data: products = [] } = useBestSellers();
  const { ref, isVisible } = useScrollReveal();
  if (products.length === 0) return null;
  return (
    <section className="section-padding" ref={ref}>
      <div className="container-shop">
        <div className={`flex items-center justify-between mb-6 reveal-left ${isVisible ? 'reveal-visible' : ''}`}>
          <h2 className="text-xl font-bold">{section.title}</h2>
          <Link to="/shop?filter=bestsellers" className="text-sm text-pink-600 font-medium flex items-center gap-1">
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

function IngredientSection({ section }: { section: HomepageSection }) {
  const ingredients = [
    { name: 'Hyaluronic Acid', desc: 'Deep hydration', emoji: '💧' },
    { name: 'Vitamin C', desc: 'Brightening', emoji: '🍊' },
    { name: 'Retinol', desc: 'Anti-aging', emoji: '✨' },
    { name: 'Niacinamide', desc: 'Pore care', emoji: '🌿' },
  ];
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="section-padding bg-gradient-to-b from-purple-50 to-background" ref={ref}>
      <div className="container-shop">
        <h2 className={`text-2xl font-bold text-center mb-8 reveal-base ${isVisible ? 'reveal-visible' : ''}`}>
          {section.title}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ingredients.map((ing, i) => (
            <div
              key={ing.name}
              className={`text-center p-6 rounded-2xl bg-card border hover:shadow-md transition-all reveal-base stagger-${i + 1} ${isVisible ? 'reveal-visible' : ''}`}
            >
              <span className="text-4xl">{ing.emoji}</span>
              <h3 className="font-semibold mt-3">{ing.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const COSMETICS_SECTIONS: Record<string, React.ComponentType<{ section: HomepageSection }>> = {
  hero_banner: HeroBannerSection,
  shop_by_concern: ShopByConcernSection,
  brand_slider: BrandSliderSection,
  best_sellers: BestSellersSection,
  ingredient_highlight: IngredientSection,
};

export function CosmeticsHomepage({ sections }: { sections: HomepageSection[] }) {
  return (
    <Layout>
      {sections.map((section) => {
        const Component = COSMETICS_SECTIONS[section.section_type];
        if (Component) return <Component key={section.id} section={section} />;
        return null;
      })}
    </Layout>
  );
}
