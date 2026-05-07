// Facebook Pixel + Conversion API utilities

import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

let pixelInitialized = false;
let pixelId: string | null = null;
let testEventCode: string | null = null;
let capiEnabled = false;

/**
 * Generate a unique event ID for deduplication between browser pixel and CAPI
 */
export function generateEventId(): string {
  return crypto.randomUUID();
}

/**
 * Get Facebook browser cookies (_fbp, _fbc) for CAPI matching
 */
function getFacebookCookies(): { fbp?: string; fbc?: string } {
  const cookies: { fbp?: string; fbc?: string } = {};
  try {
    const cookieStr = document.cookie;
    const fbpMatch = cookieStr.match(/_fbp=([^;]+)/);
    const fbcMatch = cookieStr.match(/_fbc=([^;]+)/);
    if (fbpMatch) cookies.fbp = fbpMatch[1];
    if (fbcMatch) cookies.fbc = fbcMatch[1];
  } catch {
    // cookies may not be accessible
  }
  return cookies;
}

/**
 * Send event to server-side Conversion API
 */
async function sendCapiEvent(
  eventName: string,
  params: {
    eventId: string;
    eventSourceUrl?: string;
    userData?: {
      em?: string;
      ph?: string;
      external_id?: string;
    };
    customData?: Record<string, any>;
  }
): Promise<void> {
  if (!capiEnabled) return;

  try {
    const cookies = getFacebookCookies();
    const userData: Record<string, any> = {
      client_user_agent: navigator.userAgent,
      ...cookies,
      ...params.userData,
    };

    const { error } = await supabase.functions.invoke('meta-capi', {
      body: {
        event_name: eventName,
        event_id: params.eventId,
        event_source_url: params.eventSourceUrl || window.location.href,
        user_data: userData,
        custom_data: params.customData || {},
      },
    });

    if (error) {
      console.warn(`[CAPI] Failed to send ${eventName}:`, error);
    }
  } catch (err) {
    console.warn(`[CAPI] Error sending ${eventName}:`, err);
  }
}

/**
 * Initialize Facebook Pixel - call once on app load
 */
export function initFacebookPixel(
  id: string,
  testCode?: string | null,
  enableCapi?: boolean
): boolean {
  if (pixelInitialized) return true;
  if (!id || !/^\d{10,20}$/.test(id)) {
    console.warn('[FB Pixel] Invalid Pixel ID');
    return false;
  }

  // Don't load on admin routes
  if (window.location.pathname.startsWith('/admin')) {
    return false;
  }

  try {
    pixelId = id;
    testEventCode = testCode || null;
    capiEnabled = enableCapi || false;

    // Facebook Pixel base code
    const f = window;
    const b = document;
    const e = 'script';
    
    if (f.fbq) return true;

    const n: any = (f.fbq = function () {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    });

    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];

    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = 'https://connect.facebook.net/en_US/fbevents.js';
    
    const s = b.getElementsByTagName(e)[0];
    s?.parentNode?.insertBefore(t, s);

    // Initialize pixel
    window.fbq('init', pixelId);
    
    pixelInitialized = true;
    console.log('[FB Pixel] Initialized:', pixelId, capiEnabled ? '+ CAPI' : '');
    
    return true;
  } catch (error) {
    console.warn('[FB Pixel] Failed to initialize:', error);
    return false;
  }
}

/**
 * Check if pixel is ready to track
 */
export function isPixelReady(): boolean {
  return pixelInitialized && typeof window.fbq === 'function';
}

/**
 * Track a standard or custom event (browser + CAPI)
 */
function trackEvent(
  eventName: string,
  params?: Record<string, any>,
  options?: {
    eventId?: string;
    userData?: { em?: string; ph?: string; external_id?: string };
    skipCapi?: boolean;
  }
): string {
  const eventId = options?.eventId || generateEventId();

  // Browser pixel
  if (isPixelReady() && !window.location.pathname.startsWith('/admin')) {
    try {
      const eventParams = { ...params };
      if (testEventCode) {
        eventParams.test_event_code = testEventCode;
      }
      window.fbq('track', eventName, eventParams, { eventID: eventId });
      console.log(`[FB Pixel] Event: ${eventName}`, { eventId });
    } catch (error) {
      console.warn(`[FB Pixel] Failed to track ${eventName}:`, error);
    }
  }

  // Server-side CAPI (fire-and-forget, never blocks)
  if (!options?.skipCapi) {
    sendCapiEvent(eventName, {
      eventId,
      userData: options?.userData,
      customData: params,
    }).catch(() => {});
  }

  return eventId;
}

/**
 * Track PageView event
 */
export function trackPageView(): string {
  return trackEvent('PageView', undefined, { skipCapi: false });
}

/**
 * Track ViewContent event (product page view)
 */
export function trackViewContent(params: {
  contentId: string;
  contentName: string;
  value: number;
  currency: string;
}): string {
  return trackEvent('ViewContent', {
    content_ids: [params.contentId],
    content_name: params.contentName,
    content_type: 'product',
    value: params.value,
    currency: params.currency,
  });
}

/**
 * Track AddToCart event
 */
export function trackAddToCart(params: {
  contentId: string;
  contentName: string;
  value: number;
  currency: string;
  quantity: number;
}): string {
  return trackEvent('AddToCart', {
    content_ids: [params.contentId],
    content_name: params.contentName,
    content_type: 'product',
    value: params.value,
    currency: params.currency,
    quantity: params.quantity,
  });
}

/**
 * Track InitiateCheckout event
 */
export function trackInitiateCheckout(params: {
  numItems: number;
  value: number;
  currency: string;
}): string {
  return trackEvent('InitiateCheckout', {
    num_items: params.numItems,
    value: params.value,
    currency: params.currency,
  });
}

/**
 * Track Purchase event (most important - includes user data for matching)
 */
export function trackPurchase(params: {
  orderId: string;
  value: number;
  currency: string;
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
  }>;
  email?: string;
  phone?: string;
}): string {
  return trackEvent(
    'Purchase',
    {
      value: params.value,
      currency: params.currency,
      contents: params.contents,
      content_type: 'product',
      order_id: params.orderId,
      num_items: params.contents.reduce((sum, c) => sum + c.quantity, 0),
    },
    {
      eventId: params.orderId, // Use order ID for stable dedup
      userData: {
        em: params.email || undefined,
        ph: params.phone || undefined,
        external_id: params.orderId,
      },
    }
  );
}

/**
 * Track Search event
 */
export function trackSearch(searchString: string): void {
  if (!searchString.trim()) return;
  trackEvent('Search', {
    search_string: searchString.trim(),
  });
}

/**
 * Validate Pixel ID format
 */
export function validatePixelId(id: string): boolean {
  return /^\d{10,20}$/.test(id);
}

/**
 * Test pixel connectivity (for admin validation)
 */
export function testPixelConnection(id: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!validatePixelId(id)) {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    setTimeout(() => resolve(false), 5000);
    img.src = `https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1&_=${Date.now()}`;
  });
}

/**
 * Send a test event to CAPI (for admin testing)
 */
export async function testCapiEvent(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('meta-capi', {
      body: {
        event_name: 'PageView',
        event_id: generateEventId(),
        event_source_url: window.location.href,
        user_data: {
          client_user_agent: navigator.userAgent,
        },
        custom_data: {},
        test_mode: true,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data?.skipped) {
      return { success: false, error: `Skipped: ${data.reason}` };
    }

    return { success: data?.success || false, error: data?.error };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' };
  }
}
