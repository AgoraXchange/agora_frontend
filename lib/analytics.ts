// Event types for Mixpanel tracking
export interface BaseEventProperties {
  fid?: number;
  user_id?: string;
  timestamp: number;
  environment: 'production' | 'development';
  client_type: 'coinbase_wallet' | 'farcaster' | 'browser';
  frame_added?: boolean;
}

export interface DebateEventProperties extends BaseEventProperties {
  debate_id: string;
  debate_topic: string;
  creator: string;
  total_volume?: number;
  status: 'open' | 'closed' | 'resolved';
  time_remaining?: string;
}

export interface BetEventProperties extends BaseEventProperties {
  debate_id: string;
  side: 'A' | 'B';
  amount: number;
  total_pool_a?: number;
  total_pool_b?: number;
}

export interface WalletEventProperties extends BaseEventProperties {
  wallet_address?: string;
  connection_method: 'coinbase_smart_wallet' | 'external';
}

export interface FrameEventProperties extends BaseEventProperties {
  frame_action: 'added' | 'removed' | 'notifications_enabled' | 'notifications_disabled';
  frame_url?: string;
}

// Event name constants
export const EVENTS = {
  // App lifecycle
  APP_LOADED: 'App Loaded',
  FRAME_READY: 'Frame Ready',
  
  // Frame interactions
  FRAME_ADDED: 'Frame Added',
  FRAME_REMOVED: 'Frame Removed',
  NOTIFICATIONS_ENABLED: 'Notifications Enabled',
  NOTIFICATIONS_DISABLED: 'Notifications Disabled',
  
  // Debate interactions
  DEBATE_VIEWED: 'Debate Viewed',
  DEBATE_CREATED: 'Debate Created',
  DEBATE_CARD_CLICKED: 'Debate Card Clicked',
  
  // Betting actions
  BET_PLACED: 'Bet Placed',
  BET_CANCELLED: 'Bet Cancelled',
  
  // Wallet actions
  WALLET_CONNECTED: 'Wallet Connected',
  WALLET_DISCONNECTED: 'Wallet Disconnected',
  TRANSACTION_INITIATED: 'Transaction Initiated',
  TRANSACTION_COMPLETED: 'Transaction Completed',
  TRANSACTION_FAILED: 'Transaction Failed',
  
  // Navigation
  PAGE_VIEW: 'Page View',
  CREATE_PAGE_ACCESSED: 'Create Page Accessed',
  AGREEMENT_PAGE_ACCESSED: 'Agreement Page Accessed',
  
  // UI interactions
  FLOATING_BUTTON_CLICKED: 'Floating Button Clicked',
  HEADER_ACTION: 'Header Action',
  
  // Social features
  COMMENT_POSTED: 'Comment Posted',
  SHARE_CLICKED: 'Share Clicked'
} as const;

export type EventName = typeof EVENTS[keyof typeof EVENTS];

// Helper function to create base properties
export const createBaseProperties = (
  context?: unknown,
  additionalProps?: Partial<BaseEventProperties>
): BaseEventProperties => {
  const base: BaseEventProperties = {
    timestamp: Date.now(),
    environment: process.env.NODE_ENV as 'production' | 'development',
    client_type: 'browser',
    ...additionalProps
  };

  // Add MiniKit context data if available
  if (context && typeof context === 'object' && context !== null) {
    const ctx = context as {
      user?: { fid?: number; username?: string };
      client?: { added?: boolean; name?: string };
    };
    
    base.fid = ctx.user?.fid;
    base.user_id = ctx.user?.fid?.toString() || ctx.user?.username;
    base.frame_added = ctx.client?.added;
    
    // Determine client type
    if (ctx.client?.name?.toLowerCase().includes('coinbase')) {
      base.client_type = 'coinbase_wallet';
    } else if (ctx.client?.name?.toLowerCase().includes('farcaster')) {
      base.client_type = 'farcaster';
    }
  }

  return base;
};

// Helper function to sanitize sensitive data
export const sanitizeProperties = (properties: Record<string, unknown>) => {
  const sanitized = { ...properties };
  
  // Remove potentially sensitive fields
  const sensitiveFields = ['private_key', 'mnemonic', 'seed', 'secret', 'password'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      delete sanitized[field];
    }
  }
  
  // Truncate long strings
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
      sanitized[key] = sanitized[key].substring(0, 1000) + '...';
    }
  });
  
  return sanitized;
};