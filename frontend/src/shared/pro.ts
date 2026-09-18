/**
 * Pro Paywall Scaffold
 *
 * To activate gating:
 *   1. Set PRO_ENABLED = true
 *   2. Set isProUser = false (or load dynamically from chrome.storage.sync)
 *
 * While PRO_ENABLED === false, ALL features are available to everyone (free launch mode).
 */

/** Master feature flag. Flip to true when ready to start charging. */
export const PRO_ENABLED = false;

/** Default: everyone is treated as a Pro user until paywall is activated. */
export const isProUser = true;

export type PlanTier = 'free' | 'pro';

export interface ProFeature {
  id: string;
  label: string;
  description: string;
  minPlan: PlanTier;
}

export const PRO_FEATURES: ProFeature[] = [
  {
    id: 'history',
    label: 'Post History',
    description: 'Auto-save last 5 drafts. Never lose your work.',
    minPlan: 'pro',
  },
  {
    id: 'hashtags',
    label: 'Hashtag Manager',
    description: 'Save hashtag sets and append with one click.',
    minPlan: 'pro',
  },
  {
    id: 'templates_unlimited',
    label: 'Unlimited Templates',
    description: 'Save unlimited custom templates (Free: 5 max).',
    minPlan: 'pro',
  },
];

/**
 * Check if the current user can access a given feature.
 * When PRO_ENABLED is false, always returns true.
 */
export function canUse(featureId: string): boolean {
  if (!PRO_ENABLED) return true;
  const feature = PRO_FEATURES.find((f) => f.id === featureId);
  if (!feature || feature.minPlan === 'free') return true;
  return isProUser;
}

/**
 * Get the feature definition for display in upsell UI.
 */
export function getFeature(featureId: string): ProFeature | undefined {
  return PRO_FEATURES.find((f) => f.id === featureId);
}
