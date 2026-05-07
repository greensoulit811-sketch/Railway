import { useSiteSettings } from '@/contexts/SiteSettingsContext';

// Re-export the hook for convenience
export { useSiteSettings };

// Hook for translation only
export const useTranslation = () => {
  const { t, activeLanguage } = useSiteSettings();
  return { t, language: activeLanguage };
};

// Hook for currency formatting only
export const useCurrency = () => {
  const { formatCurrency, settings } = useSiteSettings();
  return { 
    formatCurrency, 
    currencyCode: settings.currency_code,
    currencySymbol: settings.currency_symbol,
    currencyLocale: settings.currency_locale,
  };
};
