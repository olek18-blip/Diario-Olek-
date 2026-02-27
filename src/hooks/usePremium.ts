import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export type PremiumFeature = 
  | 'tts'              // Text-to-speech playback
  | 'voice_custom'     // Voice customization
  | 'ai_advanced'      // Advanced AI assistant (unlimited questions)
  | 'export'           // Export diary to PDF/text
  | 'no_ads';          // Remove ads

export interface PremiumState {
  isPremium: boolean;
  isLoading: boolean;
  plan: 'free' | 'premium';
  expiresAt: string | null;
}

/**
 * Hook to manage premium subscription status.
 * Currently returns free for all users.
 * Will be connected to Stripe when payments are configured.
 */
export const usePremium = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PremiumState>({
    isPremium: false,
    isLoading: false,
    plan: 'free',
    expiresAt: null,
  });

  // TODO: When Stripe is configured, fetch subscription status here
  // useEffect(() => {
  //   if (!user) return;
  //   fetchSubscriptionStatus(user.id);
  // }, [user]);

  const hasFeature = useCallback((feature: PremiumFeature): boolean => {
    if (state.isPremium) return true;

    // Free tier features — none of the premium ones
    const freeFeatures: PremiumFeature[] = [];
    return freeFeatures.includes(feature);
  }, [state.isPremium]);

  const upgrade = useCallback(() => {
    // TODO: Open Stripe checkout session
    console.log('[Premium] Stripe checkout not yet configured');
  }, []);

  const manage = useCallback(() => {
    // TODO: Open Stripe customer portal
    console.log('[Premium] Stripe portal not yet configured');
  }, []);

  return {
    ...state,
    hasFeature,
    upgrade,
    manage,
  };
};
