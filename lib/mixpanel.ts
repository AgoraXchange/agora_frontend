import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
const MIXPANEL_API_HOST = process.env.NEXT_PUBLIC_MIXPANEL_API_HOST; // e.g. https://api-eu.mixpanel.com
const DISABLE_IP = process.env.NEXT_PUBLIC_MIXPANEL_DISABLE_IP === 'true';
const DEFAULT_OPT_IN = process.env.NEXT_PUBLIC_ANALYTICS_DEFAULT_OPT_IN === 'true';
const CONSENT_KEY = 'agora:analytics-consent';

let isInitialized = false;

export const initMixpanel = () => {
  if (!MIXPANEL_TOKEN) {
    console.warn('Mixpanel token is missing. Analytics will not be tracked.');
    return false;
  }

  if (isInitialized) {
    return true;
  }

  try {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: process.env.NODE_ENV === 'development',
      autocapture: false,
      persistence: 'localStorage',
      // Prefer explicit API host if provided (EU/IN residency); otherwise proxy path
      api_host: MIXPANEL_API_HOST || '/mp',
      ip: DISABLE_IP ? false : undefined,
      opt_out_tracking_by_default: true,
      loaded: () => {
        // Respect saved consent; proactively opt-in in development if a token exists
        try {
          const saved = typeof window !== 'undefined' ? window.localStorage.getItem(CONSENT_KEY) : null;
          const isDev = process.env.NODE_ENV !== 'production';
          if (saved === 'true' || (!saved && (DEFAULT_OPT_IN || isDev))) {
            mixpanel.opt_in_tracking();
            if (typeof window !== 'undefined') window.localStorage.setItem(CONSENT_KEY, 'true');
          }
        } catch {}
        console.log('Mixpanel initialized successfully');
      },
    });

    isInitialized = true;
    return true;
  } catch (error) {
    console.error('Failed to initialize Mixpanel:', error);
    return false;
  }
};

export const getMixpanel = () => {
  if (!isInitialized && !initMixpanel()) {
    return null;
  }
  return mixpanel;
};

export const isAnalyticsEnabled = () => {
  // Enable analytics whenever a token is present; consent gate handled above
  return Boolean(MIXPANEL_TOKEN);
};

export const registerSuperProperties = (props: Record<string, unknown>) => {
  const mp = getMixpanel();
  if (!mp) return;
  try {
    mp.register(props);
  } catch (e) {
    console.error('Mixpanel register error:', e);
  }
};

export const resetAnalytics = () => {
  const mp = getMixpanel();
  if (!mp) return;
  try {
    mp.reset();
  } catch (e) {
    console.error('Mixpanel reset error:', e);
  }
};

export const optInAnalytics = () => {
  const mp = getMixpanel();
  if (!mp) return;
  try {
    mp.opt_in_tracking();
    if (typeof window !== 'undefined') window.localStorage.setItem(CONSENT_KEY, 'true');
  } catch (e) {
    console.error('Mixpanel opt-in error:', e);
  }
};

export const optOutAnalytics = () => {
  const mp = getMixpanel();
  if (!mp) return;
  try {
    mp.opt_out_tracking();
    if (typeof window !== 'undefined') window.localStorage.setItem(CONSENT_KEY, 'false');
  } catch (e) {
    console.error('Mixpanel opt-out error:', e);
  }
};
