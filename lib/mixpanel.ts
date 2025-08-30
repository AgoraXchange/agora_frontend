import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

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
      track_pageview: false, // We'll track page views manually
      persistence: 'localStorage',
      api_host: '/mp', // Use proxy to avoid CORS issues
      loaded: () => {
        console.log('Mixpanel initialized successfully');
      }
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
  const enableDev = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_DEV === 'true';
  return Boolean(MIXPANEL_TOKEN) && (process.env.NODE_ENV === 'production' || enableDev);
};
