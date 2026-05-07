export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  category: string;
  categorySlug: string;
  stock: number;
  sku: string;
  shortDescription: string;
  description: string;
  images: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}

export interface SliderSlide {
  id: string;
  image: string;
  heading: string;
  text: string;
  ctaText: string;
  ctaLink: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
  avatar?: string;
}

// Sample Categories
export const categories: Category[] = [
  {
    id: '1',
    name: 'Dresses',
    slug: 'dresses',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059f581ce?w=600&q=80',
    productCount: 45,
  },
  {
    id: '2',
    name: 'Tops',
    slug: 'tops',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
    productCount: 30,
  },
  {
    id: '3',
    name: 'Bottoms',
    slug: 'bottoms',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
    productCount: 25,
  },
  {
    id: '4',
    name: 'Accessories',
    slug: 'accessories',
    image: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=600&q=80',
    productCount: 20,
  },
];

// Sample Products
export const products: Product[] = [
  {
    id: '1',
    name: 'Floral Print Summer Dress',
    slug: 'floral-summer-dress',
    price: 89,
    salePrice: 69,
    category: 'Dresses',
    categorySlug: 'dresses',
    stock: 25,
    sku: 'DR-FLR-001',
    shortDescription: 'Light and airy floral dress perfect for summer days.',
    description: 'Embrace the warm weather with this stunning floral print summer dress. Featuring a flattering A-line silhouette, breathable cotton blend fabric, and a delicate tie-waist detail. Perfect for picnics, garden parties, or casual weekend outings.',
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
      'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=800&q=80',
    ],
    isNew: true,
    isFeatured: true,
  },
  {
    id: '2',
    name: 'Classic Evening Gown',
    slug: 'classic-evening-gown',
    price: 249,
    category: 'Dresses',
    categorySlug: 'dresses',
    stock: 10,
    sku: 'DR-EVG-002',
    shortDescription: 'Elegant floor-length gown for special occasions.',
    description: 'Make an unforgettable entrance in this classic evening gown. Crafted from luxurious silk-blend satin, it features a draped neckline, a thigh-high slit, and a form-fitting silhouette that flatters every curve. Elevate your formalwear wardrobe with this timeless piece.',
    images: [
      'https://images.unsplash.com/photo-1566160918074-60124ad722ba?w=800&q=80',
      'https://images.unsplash.com/photo-1566160918074-60124ad722ba?w=800&q=80',
    ],
    isBestSeller: true,
    isFeatured: true,
  },
  {
    id: '3',
    name: 'Bohemian Maxi Dress',
    slug: 'boho-maxi-dress',
    price: 119,
    salePrice: 99,
    category: 'Dresses',
    categorySlug: 'dresses',
    stock: 30,
    sku: 'DR-MAX-003',
    shortDescription: 'Flowy maxi dress with intricate embroidery.',
    description: 'Channel your inner free spirit with this gorgeous bohemian maxi dress. The lightweight, crinkled fabric drapes beautifully, while the detailed embroidery along the neckline and cuffs adds a touch of artisan charm. Style with sandals or boots for a versatile look.',
    images: [
      'https://images.unsplash.com/photo-1515347619362-e6fd236aee18?w=800&q=80',
      'https://images.unsplash.com/photo-1515347619362-e6fd236aee18?w=800&q=80',
    ],
    isNew: true,
  },
  {
    id: '4',
    name: 'Chic Wrap Dress',
    slug: 'chic-wrap-dress',
    price: 135,
    category: 'Dresses',
    categorySlug: 'dresses',
    stock: 15,
    sku: 'DR-WRP-004',
    shortDescription: 'Versatile wrap dress suitable for work or dinner.',
    description: 'The ultimate wardrobe staple, this chic wrap dress effortlessly transitions from day to night. Made from a premium, wrinkle-resistant jersey fabric, it offers a comfortable, customizable fit that accentuates the waist. A must-have for the modern woman.',
    images: [
      'https://images.unsplash.com/photo-1618932260643-ee43e602fded?w=800&q=80',
      'https://images.unsplash.com/photo-1618932260643-ee43e602fded?w=800&q=80',
    ],
    isFeatured: true,
  },
  {
    id: '5',
    name: 'Casual Denim Overall Dress',
    slug: 'denim-overall-dress',
    price: 75,
    category: 'Dresses',
    categorySlug: 'dresses',
    stock: 40,
    sku: 'DR-DNM-005',
    shortDescription: 'Playful and comfortable denim overall dress.',
    description: 'Add a playful touch to your casual lineup with this denim overall dress. Constructed from durable, vintage-wash denim, it features adjustable straps, functional pockets, and a relaxed fit. Layer it over your favorite tees or sweaters for year-round style.',
    images: [
      'https://images.unsplash.com/photo-1622122201714-3a726ef4ba95?w=800&q=80',
      'https://images.unsplash.com/photo-1622122201714-3a726ef4ba95?w=800&q=80',
    ],
    isBestSeller: true,
  },
  {
    id: '6',
    name: 'Lace Cocktail Midi',
    slug: 'lace-cocktail-midi',
    price: 180,
    salePrice: 150,
    category: 'Dresses',
    categorySlug: 'dresses',
    stock: 20,
    sku: 'DR-LCE-006',
    shortDescription: 'Sophisticated midi dress featuring delicate lace detailing.',
    description: 'Exude sophistication in this stunning lace cocktail midi dress. The intricate lace overlay, scalloped edges, and semi-sheer sleeves create a romantic and polished look. Ideal for weddings, cocktail parties, and upscale events.',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059f581ce?w=800&q=80',
      'https://images.unsplash.com/photo-1595777457583-95e059f581ce?w=800&q=80',
    ],
    isNew: true,
  },
  {
    id: '7',
    name: 'Ribbed Knit Bodycon',
    slug: 'ribbed-knit-bodycon',
    price: 65,
    category: 'Dresses',
    categorySlug: 'dresses',
    stock: 50,
    sku: 'DR-KNT-007',
    shortDescription: 'Figure-hugging ribbed knit dress for everyday wear.',
    description: 'Embrace comfort without compromising on style in this ribbed knit bodycon dress. The stretchy, medium-weight fabric hugs your curves perfectly while providing all-day comfort. Dress it up with heels or keep it casual with sneakers.',
    images: [
      'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=800&q=80',
      'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=800&q=80',
    ],
    isBestSeller: true,
    isFeatured: true,
  },
  {
    id: '8',
    name: 'Polka Dot Midi Dress',
    slug: 'polka-dot-midi',
    price: 95,
    salePrice: 75,
    category: 'Dresses',
    categorySlug: 'dresses',
    stock: 35,
    sku: 'DR-PLK-008',
    shortDescription: 'Retro-inspired polka dot dress with a modern twist.',
    description: 'Bring a touch of retro charm to your wardrobe with this polka dot midi dress. Featuring a sweetheart neckline, puff sleeves, and a tiered skirt, it offers a fun and feminine aesthetic. Perfect for dates, brunch, or exploring the city.',
    images: [
      'https://images.unsplash.com/photo-1605763240000-7e93b172d754?w=800&q=80',
      'https://images.unsplash.com/photo-1605763240000-7e93b172d754?w=800&q=80',
    ],
    isNew: true,
    isFeatured: true,
  },
];

// Sample Slider Slides
export const sliderSlides: SliderSlide[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80',
    heading: 'Summer Dress Collection',
    text: 'Discover elegant styles for the warm season',
    ctaText: 'Shop Dresses',
    ctaLink: '/shop?category=dresses',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1549298240-0d8e60513026?w=1920&q=80',
    heading: 'Evening Elegance',
    text: 'Stunning gowns for your special moments',
    ctaText: 'View Collection',
    ctaLink: '/shop?category=dresses',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=80',
    heading: 'New Arrivals',
    text: 'Update your wardrobe with the latest trends',
    ctaText: 'Explore',
    ctaLink: '/shop',
  },
];

// Sample Reviews
export const reviews: Review[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    rating: 5,
    text: 'Absolutely love the quality of products here! Fast shipping and excellent customer service.',
    date: '2024-01-15',
  },
  {
    id: '2',
    name: 'Michael Chen',
    rating: 5,
    text: 'The headphones I bought exceeded my expectations. Will definitely shop here again!',
    date: '2024-01-10',
  },
  {
    id: '3',
    name: 'Emily Davis',
    rating: 4,
    text: 'Great selection and competitive prices. The checkout process was smooth and easy.',
    date: '2024-01-05',
  },
];

// Helper functions
export const getProductBySlug = (slug: string): Product | undefined => {
  return products.find(p => p.slug === slug);
};

export const getProductsByCategory = (categorySlug: string): Product[] => {
  return products.filter(p => p.categorySlug === categorySlug);
};

export const getFeaturedProducts = (): Product[] => {
  return products.filter(p => p.isFeatured);
};

export const getBestSellers = (): Product[] => {
  return products.filter(p => p.isBestSeller);
};

export const getNewArrivals = (): Product[] => {
  return products.filter(p => p.isNew);
};

export const getCategoryBySlug = (slug: string): Category | undefined => {
  return categories.find(c => c.slug === slug);
};

export const getRelatedProducts = (product: Product, limit = 4): Product[] => {
  return products
    .filter(p => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, limit);
};
