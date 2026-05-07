import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingCart,
  Image,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  Store,
  Truck,
  Tag,
  MapPin,
  MessageSquare,
  Users,
  ShieldCheck,
  CreditCard,
  FileText,
  Megaphone,
  LayoutTemplate,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { t } = useSiteSettings();
  const { user, signOut, userRole, isAdmin } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  // Role-based sidebar items
  const allItems = [
    { name: t('admin.dashboard'), href: '/admin', icon: LayoutDashboard, roles: ['admin', 'manager', 'order_handler'] },
    { name: t('admin.products'), href: '/admin/products', icon: Package, roles: ['admin', 'manager'] },
    { name: t('admin.categories'), href: '/admin/categories', icon: FolderOpen, roles: ['admin', 'manager'] },
    { name: t('admin.orders'), href: '/admin/orders', icon: ShoppingCart, roles: ['admin', 'manager', 'order_handler'] },
    { name: 'Checkout Leads', href: '/admin/leads', icon: Users, roles: ['admin', 'manager'] },
    { name: t('admin.slider'), href: '/admin/slider', icon: Image, roles: ['admin', 'manager'] },
    { name: 'Coupons', href: '/admin/coupons', icon: Tag, roles: ['admin', 'manager'] },
    { name: 'Shipping Zones', href: '/admin/shipping', icon: MapPin, roles: ['admin'] },
    { name: 'Shipping Methods', href: '/admin/shipping-methods', icon: Truck, roles: ['admin'] },
    { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare, roles: ['admin', 'manager'] },
    { name: 'Courier', href: '/admin/courier', icon: Truck, roles: ['admin'] },
    { name: 'Payment Methods', href: '/admin/payment-methods', icon: CreditCard, roles: ['admin'] },
    { name: 'Pages', href: '/admin/pages', icon: FileText, roles: ['admin'] },
    { name: 'Landing Pages', href: '/admin/landing-pages', icon: Megaphone, roles: ['admin'] },
    { name: 'Homepage', href: '/admin/homepage', icon: LayoutTemplate, roles: ['admin'] },
    { name: 'Users', href: '/admin/users', icon: ShieldCheck, roles: ['admin'] },
    { name: t('admin.settings'), href: '/admin/settings', icon: Settings, roles: ['admin'] },
  ];

  const sidebarItems = allItems.filter((item) => item.roles.includes(userRole || ''));

  const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    manager: 'Manager',
    order_handler: 'Staff',
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-border shrink-0">
        <Link to="/admin" className="flex items-center gap-2">
          <span className="text-xl font-bold">STORE</span>
          <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">
            {t('common.admin')}
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
              {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-1 shrink-0">
        {user && (
          <div className="px-4 py-2 text-xs text-muted-foreground">
            <p className="truncate">{user.email}</p>
            {userRole && (
              <Badge variant="outline" className="mt-1 text-[10px]">
                {ROLE_LABELS[userRole] || userRole}
              </Badge>
            )}
          </div>
        )}
        <Link 
          to="/" 
          className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
        >
          <Store className="h-5 w-5" />
          <span className="font-medium">Back to Store</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:block w-64 bg-card border-r border-border shrink-0">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="lg:hidden sticky top-0 z-40 bg-card border-b border-border">
          <div className="flex items-center justify-between h-16 px-4">
            <Link to="/admin" className="flex items-center gap-2">
              <span className="text-xl font-bold">STORE</span>
              <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">
                {t('common.admin')}
              </span>
            </Link>

            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
