import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, Search, User, Globe } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { totalItems } = useCart();
  const { t, activeLanguage, setUserLanguagePreference } = useSiteSettings();
  const { data: storeSettings } = useStoreSettings();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const storeName = storeSettings?.store_name || 'STORE';
  const storeLogo = storeSettings?.store_logo || '';

  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.shop'), href: '/shop' },
    { name: t('nav.categories'), href: '/categories' },
    { name: t('nav.about'), href: '/about' },
    { name: t('nav.contact'), href: '/contact' },
  ];

  const languageOptions = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'bn', label: 'বাংলা' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="container-shop">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10">
                <Menu className="h-7 w-7" />
                <span className="sr-only">{t('nav.openMenu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <nav className="flex flex-col gap-4 mt-8">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`text-xl font-semibold transition-colors hover:text-accent ${
                      location.pathname === item.href
                        ? 'text-accent'
                        : 'text-foreground'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <hr className="my-4 border-border" />
                <Link
                  to="/admin"
                  className="text-lg font-medium text-muted-foreground hover:text-foreground"
                >
                  {t('nav.adminPanel')}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            {storeLogo ? (
              <img 
                src={storeLogo} 
                alt={storeName} 
                className="h-12 md:h-14 w-auto object-contain"
              />
            ) : (
              <span className="text-2xl md:text-4xl font-bold tracking-tight">
                {storeName}
              </span>
            )}
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-lg font-semibold tracking-wide transition-colors hover:text-accent ${
                  location.pathname === item.href
                    ? 'text-accent'
                    : 'text-foreground'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="hidden sm:flex"
            >
              <Search className="h-6 w-6" />
              <span className="sr-only">{t('common.search')}</span>
            </Button>

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                  <Globe className="h-6 w-6" />
                  <span className="sr-only">{t('common.language')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover z-50">
                {languageOptions.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setUserLanguagePreference(lang.code)}
                    className={activeLanguage === lang.code ? 'bg-accent/10' : ''}
                  >
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/admin">
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <User className="h-6 w-6" />
                <span className="sr-only">{t('common.admin')}</span>
              </Button>
            </Link>

            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <ShoppingBag className="h-7 w-7" />
                {totalItems > 0 && (
                  <span className="cart-badge">{totalItems}</span>
                )}
                <span className="sr-only">{t('common.cart')}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Search bar */}
        {isSearchOpen && (
          <div className="py-4 border-t border-border animate-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder={t('nav.searchProducts')}
                className="input-shop pl-10"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
