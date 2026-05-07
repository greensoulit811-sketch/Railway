import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DebugPanel } from "@/components/DebugPanel";
import { FacebookPixelProvider } from "@/components/FacebookPixelProvider";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { ScrollToTop } from "@/components/ScrollToTop";
import { DynamicFavicon } from "@/components/DynamicFavicon";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
// Store pages
import Index from "./pages/Index";
import ShopPage from "./pages/ShopPage";
import CategoriesPage from "./pages/CategoriesPage";
import CategoryPage from "./pages/CategoryPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import FAQPage from "./pages/FAQPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminRegisterPage from "./pages/admin/AdminRegisterPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetails from "./pages/admin/AdminOrderDetails";
import AdminSlider from "./pages/admin/AdminSlider";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminCourierSettings from "./pages/admin/AdminCourierSettings";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminShipping from "./pages/admin/AdminShipping";
import AdminShippingMethods from "./pages/admin/AdminShippingMethods";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminCheckoutLeads from "./pages/admin/AdminCheckoutLeads";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPaymentMethods from "./pages/admin/AdminPaymentMethods";
import AdminPages from "./pages/admin/AdminPages";
import AdminLandingPages from "./pages/admin/AdminLandingPages";
import AdminHomepage from "./pages/admin/AdminHomepage";
import TrackOrderPage from "./pages/TrackOrderPage";
import LandingPageView from "./pages/LandingPageView";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SiteSettingsProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <FacebookPixelProvider>
                  <ScrollToTop />
                  <DynamicFavicon />
                  <Routes>
                    {/* Public Store Routes - No auth required */}
                    <Route path="/" element={<Index />} />
                    <Route path="/shop" element={<ShopPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/category/:slug" element={<CategoryPage />} />
                    <Route path="/product/:slug" element={<ProductDetailsPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/order-success" element={<OrderSuccessPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/track-order" element={<TrackOrderPage />} />
                    <Route path="/lp/:slug" element={<LandingPageView />} />

                    {/* Admin Auth Routes - No protection */}
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route path="/admin/register" element={<AdminRegisterPage />} />

                    {/* Protected Admin Routes */}
                    <Route element={<ProtectedAdminRoute />}>
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="categories" element={<AdminCategories />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="orders/:id" element={<AdminOrderDetails />} />
                        <Route path="slider" element={<AdminSlider />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="courier" element={<AdminCourierSettings />} />
                        <Route path="coupons" element={<AdminCoupons />} />
                        <Route path="shipping" element={<AdminShipping />} />
                        <Route path="shipping-methods" element={<AdminShippingMethods />} />
                        <Route path="reviews" element={<AdminReviews />} />
                        <Route path="leads" element={<AdminCheckoutLeads />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="payment-methods" element={<AdminPaymentMethods />} />
                        <Route path="pages" element={<AdminPages />} />
                        <Route path="landing-pages" element={<AdminLandingPages />} />
                        <Route path="homepage" element={<AdminHomepage />} />
                      </Route>
                    </Route>

                    {/* Catch-all */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <CookieConsentBanner />
                  <WhatsAppWidget />
                  <DebugPanel />
                </FacebookPixelProvider>
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </SiteSettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
