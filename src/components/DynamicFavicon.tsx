import { useEffect } from 'react';
import { useStoreSettings } from '@/hooks/useStoreSettings';

export function DynamicFavicon() {
  const { data: storeSettings } = useStoreSettings();

  useEffect(() => {
    if (storeSettings?.store_favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = storeSettings.store_favicon;
    }
  }, [storeSettings?.store_favicon]);

  return null;
}
