import { useParams, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { useCategory, useProductsByCategory } from '@/hooks/useShopData';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: category, isLoading: categoryLoading } = useCategory(slug || '');
  const { data: products = [], isLoading: productsLoading } = useProductsByCategory(slug || '');

  const isLoading = categoryLoading || productsLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="h-48 md:h-64 bg-muted animate-pulse" />
        <div className="container-shop section-padding">
          <div className="product-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-product rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!category) {
    return (
      <Layout>
        <div className="container-shop section-padding text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <Link to="/shop" className="text-accent hover:underline">
            Return to Shop
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-3xl md:text-4xl font-bold">{category.name}</h1>
            <p className="mt-2 text-white/80">{products.length} Products</p>
          </div>
        </div>
      </div>

      <div className="container-shop section-padding">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/categories" className="hover:text-foreground">
            Categories
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{category.name}</span>
        </nav>

        {/* Products */}
        {products.length > 0 ? (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No products in this category yet
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
