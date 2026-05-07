import { Layout } from '@/components/layout/Layout';
import { useFeaturedProducts, useBestSellers, useCategories } from '@/hooks/useShopData';
import { ProductCard } from '@/components/products/ProductCard';
import { Link } from 'react-router-dom';
import { ArrowRight, Sofa, BedDouble, CookingPot, Lamp } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { HomepageSection } from '@/hooks/useHomepageTemplates';

function VisualHeroSection({ section }: { section: HomepageSection }) {
  return (
    <section className="relative h-[550px] bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 flex items-center overflow-hidden">
      <div className="container-shop relative z-10">
        <div className="max-w-lg">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight text-stone-900">{section.title}</h1>
          <Link to="/shop" className="inline-flex items-center gap-2 bg-stone-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-stone-800 transition-colors">
            Explore Collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ShopByRoomSection({ section }: { section: HomepageSection }) {
  const rooms = [
    { icon: Sofa, label: 'Living Room', color: 'bg-amber-100 text-amber-700' },
    { icon: BedDouble, label: 'Bedroom', color: 'bg-blue-100 text-blue-700' },
    { icon: CookingPot, label: 'Kitchen', color: 'bg-green-100 text-green-700' },
    { icon: Lamp, label: 'Office', color: 'bg-purple-100 text-purple-700' },
  ];
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="section-padding" ref={ref}>
      <div className="container-shop">
        <h2 className={`text-2xl font-bold text-center mb-8 reveal-base ${isVisible ? 'reveal-visible' : ''}`}>
          {section.title}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {rooms.map((r, i) => (
            <Link
              key={r.label}
              to="/shop"
              className={`flex flex-col items-center gap-4 p-8 rounded-2xl border hover:shadow-xl transition-all reveal-base stagger-${i + 1} ${isVisible ? 'reveal-visible' : ''}`}
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${r.color}`}>
                <r.icon className="h-9 w-9" />
              </div>
              <span className="font-semibold text-lg">{r.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedCollectionsSection({ section }: { section: HomepageSection }) {
  const { data: products = [] } = useFeaturedProducts();
  const { ref, isVisible } = useScrollReveal();
  if (products.length === 0) return null;

  return (
    <section className="section-padding bg-stone-50" ref={ref}>
      <div className="container-shop">
        <div className={`flex items-center justify-between mb-6 reveal-left ${isVisible ? 'reveal-visible' : ''}`}>
          <h2 className="text-xl font-bold">{section.title}</h2>
          <Link to="/shop" className="text-sm text-amber-700 font-medium flex items-center gap-1">
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

function MaterialHighlightSection({ section }: { section: HomepageSection }) {
  const materials = [
    { name: 'Solid Wood', desc: 'Premium teak & oak', emoji: '🪵' },
    { name: 'Metal Frame', desc: 'Industrial strength', emoji: '🔩' },
    { name: 'Fabric', desc: 'Premium upholstery', emoji: '🧵' },
    { name: 'Marble Top', desc: 'Luxury finish', emoji: '🪨' },
  ];
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="section-padding" ref={ref}>
      <div className="container-shop">
        <h2 className={`text-2xl font-bold text-center mb-8 reveal-base ${isVisible ? 'reveal-visible' : ''}`}>
          {section.title}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {materials.map((m, i) => (
            <div
              key={m.name}
              className={`text-center p-6 rounded-2xl bg-card border hover:shadow-md transition-all reveal-base stagger-${i + 1} ${isVisible ? 'reveal-visible' : ''}`}
            >
              <span className="text-4xl">{m.emoji}</span>
              <h3 className="font-semibold mt-3">{m.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CustomerGallerySection({ section }: { section: HomepageSection }) {
  const { data: products = [] } = useBestSellers();
  const { ref, isVisible } = useScrollReveal();
  if (products.length === 0) return null;

  return (
    <section className="section-padding bg-amber-50" ref={ref}>
      <div className="container-shop">
        <h2 className={`text-2xl font-bold text-center mb-8 reveal-base ${isVisible ? 'reveal-visible' : ''}`}>
          {section.title}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.slice(0, 4).map((p) => (
            <Link key={p.id} to={`/product/${p.slug}`} className="group">
              <div className="aspect-square rounded-xl overflow-hidden">
                <img src={p.images?.[0] || ''} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <p className="mt-2 text-sm font-medium text-center">{p.name}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const FURNITURE_SECTIONS: Record<string, React.ComponentType<{ section: HomepageSection }>> = {
  visual_hero: VisualHeroSection,
  shop_by_room: ShopByRoomSection,
  featured_collections: FeaturedCollectionsSection,
  material_highlight: MaterialHighlightSection,
  customer_gallery: CustomerGallerySection,
};

export function FurnitureHomepage({ sections }: { sections: HomepageSection[] }) {
  return (
    <Layout>
      {sections.map((section) => {
        const Component = FURNITURE_SECTIONS[section.section_type];
        if (Component) return <Component key={section.id} section={section} />;
        return null;
      })}
    </Layout>
  );
}
