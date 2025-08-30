import { useCallback } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { getMixpanel, isAnalyticsEnabled } from '@/lib/mixpanel';
import { 
  EventName, 
  DebateEventProperties, 
  BetEventProperties, 
  WalletEventProperties, 
  FrameEventProperties,
  createBaseProperties, 
  sanitizeProperties 
} from '@/lib/analytics';

export const useAnalytics = () => {
  const { context } = useMiniKit();
  const mixpanel = getMixpanel();

  const track = useCallback((
    eventName: EventName,
    properties?: Record<string, unknown>
  ) => {
    if (!isAnalyticsEnabled() || !mixpanel) {
      console.log('Analytics disabled or not initialized:', eventName, properties);
      return;
    }

    try {
      const baseProperties = createBaseProperties(context, properties);
      const sanitizedProperties = sanitizeProperties({
        ...baseProperties,
        ...properties
      });

      mixpanel.track(eventName, sanitizedProperties);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Analytics event tracked:', eventName, sanitizedProperties);
      }
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }, [context, mixpanel]);

  const identify = useCallback((userId: string, properties?: Record<string, unknown>) => {
    if (!isAnalyticsEnabled() || !mixpanel) {
      return;
    }

    try {
      mixpanel.identify(userId);
      
      if (properties) {
        const sanitizedProperties = sanitizeProperties(properties);
        mixpanel.people.set(sanitizedProperties);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('User identified:', userId, properties);
      }
    } catch (error) {
      console.error('Error identifying user:', error);
    }
  }, [mixpanel]);

  const setUserProperties = useCallback((properties: Record<string, unknown>) => {
    if (!isAnalyticsEnabled() || !mixpanel) {
      return;
    }

    try {
      const sanitizedProperties = sanitizeProperties(properties);
      mixpanel.people.set(sanitizedProperties);
    } catch (error) {
      console.error('Error setting user properties:', error);
    }
  }, [mixpanel]);

  // Convenience methods for specific event types
  const trackDebateEvent = useCallback((
    eventName: EventName,
    properties: Partial<DebateEventProperties>
  ) => {
    track(eventName, properties);
  }, [track]);

  const trackBetEvent = useCallback((
    eventName: EventName, 
    properties: Partial<BetEventProperties>
  ) => {
    track(eventName, properties);
  }, [track]);

  const trackWalletEvent = useCallback((
    eventName: EventName,
    properties: Partial<WalletEventProperties>
  ) => {
    track(eventName, properties);
  }, [track]);

  const trackFrameEvent = useCallback((
    eventName: EventName,
    properties: Partial<FrameEventProperties>
  ) => {
    track(eventName, properties);
  }, [track]);

  const trackPageView = useCallback((
    pageName: string,
    additionalProperties?: Record<string, unknown>
  ) => {
    track('Page View', {
      page_name: pageName,
      ...additionalProperties
    });
  }, [track]);

  // Auto-identify user if FID is available
  const autoIdentify = useCallback(() => {
    if (context?.user?.fid) {
      identify(context.user.fid.toString(), {
        fid: context.user.fid,
        username: context.user.username,
        display_name: context.user.display_name,
        pfp_url: context.user.pfp_url,
        client_name: context.client?.name,
        frame_added: context.client?.added
      });
    }
  }, [context, identify]);

  return {
    track,
    identify,
    setUserProperties,
    trackDebateEvent,
    trackBetEvent,
    trackWalletEvent,
    trackFrameEvent,
    trackPageView,
    autoIdentify,
    isEnabled: isAnalyticsEnabled(),
    context
  };
};