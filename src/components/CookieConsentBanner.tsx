import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import {
  acceptCookieConsent,
  declineCookieConsent,
  getConsentStatus,
} from '@/components/FacebookPixelProvider';

export function CookieConsentBanner() {
  const { settings, t } = useSiteSettings();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Only show if consent is enabled and pixel is configured
    if (!settings.cookie_consent_enabled) return;
    if (!settings.fb_pixel_enabled || !settings.fb_pixel_id) return;

    // Check if user already made a choice
    const status = getConsentStatus();
    if (status === null) {
      setShowBanner(true);
    }
  }, [settings]);

  const handleAccept = () => {
    acceptCookieConsent();
    setShowBanner(false);
  };

  const handleDecline = () => {
    declineCookieConsent();
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card border-t border-border shadow-lg animate-in slide-in-from-bottom-5">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="h-6 w-6 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">
                {t('cookieConsent.title') || 'We use cookies'}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('cookieConsent.message') ||
                  'We use cookies and similar technologies to improve your experience, analyze traffic, and for marketing purposes.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleDecline}>
              {t('cookieConsent.decline') || 'Decline'}
            </Button>
            <Button className="btn-accent" size="sm" onClick={handleAccept}>
              {t('cookieConsent.accept') || 'Accept'}
            </Button>
          </div>
          <button
            onClick={handleDecline}
            className="absolute top-2 right-2 sm:static p-1 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
