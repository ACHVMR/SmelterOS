/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Paywall Service
 * Tiered Access Control with Free Alternatives & Upgrade Prompts
 * Uses HTTP REST API for Firestore (no SDK dependency)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { getAuthHeaders, buildFirestoreEndpoint } from '../gcp/auth';
import { GCP_PROJECT } from '../gcp/config';
import {
  TierLevel,
  TIER_CONFIGS,
  ToolProfile,
  canAccessTool,
  getToolById,
  CapabilityVertical,
} from './roster';

// =============================================================================
// USER PROFILE
// =============================================================================

export interface UserProfile {
  userId: string;
  email: string;
  tierLevel: TierLevel;
  firebaseUid?: string;
  
  // Usage tracking
  requestsToday: number;
  lastRequestDate: string;
  totalRequests: number;
  
  // Subscription
  subscriptionId?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// PAYWALL RESULT
// =============================================================================

export interface PaywallResult {
  allowed: boolean;
  reason?: 'tier_mismatch' | 'rate_limit' | 'subscription_expired' | 'tool_not_found';
  
  // When blocked
  blockedTool?: ToolProfile;
  suggestedAlternative?: ToolProfile;
  upgradePrompt?: string;
  upgradeUrl?: string;
  
  // When allowed
  tool?: ToolProfile;
  remainingRequests?: number;
}

// =============================================================================
// FIRESTORE REST HELPERS
// =============================================================================

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: null;
}

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return { integerValue: String(value) };
  if (typeof value === 'boolean') return { booleanValue: value };
  return { stringValue: String(value) };
}

function fromFirestoreValue(value: FirestoreValue): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return parseInt(value.integerValue!, 10);
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  return null;
}

function profileToFirestoreFields(profile: UserProfile): Record<string, FirestoreValue> {
  return {
    userId: toFirestoreValue(profile.userId),
    email: toFirestoreValue(profile.email),
    tierLevel: toFirestoreValue(profile.tierLevel),
    requestsToday: toFirestoreValue(profile.requestsToday),
    lastRequestDate: toFirestoreValue(profile.lastRequestDate),
    totalRequests: toFirestoreValue(profile.totalRequests),
    createdAt: toFirestoreValue(profile.createdAt),
    updatedAt: toFirestoreValue(profile.updatedAt),
    subscriptionId: toFirestoreValue(profile.subscriptionId),
    subscriptionStartDate: toFirestoreValue(profile.subscriptionStartDate),
    subscriptionEndDate: toFirestoreValue(profile.subscriptionEndDate),
  };
}

function firestoreFieldsToProfile(fields: Record<string, FirestoreValue>): UserProfile {
  return {
    userId: fromFirestoreValue(fields.userId) as string,
    email: fromFirestoreValue(fields.email) as string,
    tierLevel: (fromFirestoreValue(fields.tierLevel) as TierLevel) || 'free',
    requestsToday: (fromFirestoreValue(fields.requestsToday) as number) || 0,
    lastRequestDate: fromFirestoreValue(fields.lastRequestDate) as string,
    totalRequests: (fromFirestoreValue(fields.totalRequests) as number) || 0,
    createdAt: fromFirestoreValue(fields.createdAt) as string,
    updatedAt: fromFirestoreValue(fields.updatedAt) as string,
    subscriptionId: fromFirestoreValue(fields.subscriptionId) as string | undefined,
    subscriptionStartDate: fromFirestoreValue(fields.subscriptionStartDate) as string | undefined,
    subscriptionEndDate: fromFirestoreValue(fields.subscriptionEndDate) as string | undefined,
  };
}

// =============================================================================
// PAYWALL SERVICE
// =============================================================================

export class PaywallService {
  private readonly COLLECTION = 'user-profiles';

  // ───────────────────────────────────────────────────────────────────────────
  // USER PROFILE MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Get or create user profile
   */
  async getOrCreateProfile(userId: string, email: string): Promise<UserProfile> {
    try {
      const endpoint = buildFirestoreEndpoint(this.COLLECTION, userId);
      const headers = await getAuthHeaders();

      // Try to get existing profile
      const getResponse = await fetch(endpoint, {
        method: 'GET',
        headers,
      });

      if (getResponse.ok) {
        const doc = await getResponse.json() as { fields?: Record<string, FirestoreValue> };
        if (doc.fields) {
          return firestoreFieldsToProfile(doc.fields);
        }
      }

      // Create new free tier profile
      const profile: UserProfile = {
        userId,
        email,
        tierLevel: 'free',
        requestsToday: 0,
        lastRequestDate: new Date().toISOString().split('T')[0],
        totalRequests: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Write to Firestore
      const createEndpoint = `${buildFirestoreEndpoint(this.COLLECTION)}?documentId=${userId}`;
      await fetch(createEndpoint, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: profileToFirestoreFields(profile) }),
      });

      return profile;
    } catch (error) {
      console.error('[PaywallService] Error getting/creating profile:', error);
      // Return a default free profile on error
      return {
        userId,
        email,
        tierLevel: 'free',
        requestsToday: 0,
        lastRequestDate: new Date().toISOString().split('T')[0],
        totalRequests: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Update user tier (called after Firebase Auth upgrade)
   */
  async upgradeTier(userId: string, newTier: TierLevel, subscriptionId?: string): Promise<UserProfile> {
    const existing = await this.getOrCreateProfile(userId, '');
    
    const updatedProfile: UserProfile = {
      ...existing,
      tierLevel: newTier,
      updatedAt: new Date().toISOString(),
    };

    if (subscriptionId) {
      updatedProfile.subscriptionId = subscriptionId;
      updatedProfile.subscriptionStartDate = new Date().toISOString();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      updatedProfile.subscriptionEndDate = endDate.toISOString();
    }

    try {
      const endpoint = buildFirestoreEndpoint(this.COLLECTION, userId);
      const headers = await getAuthHeaders();

      await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: profileToFirestoreFields(updatedProfile) }),
      });

      return updatedProfile;
    } catch (error) {
      console.error('[PaywallService] Error upgrading tier:', error);
      return updatedProfile;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ACCESS CONTROL
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Check if user can access a specific tool
   * Implements the paywall logic with alternatives
   */
  async checkToolAccess(userId: string, email: string, toolId: string): Promise<PaywallResult> {
    const profile = await this.getOrCreateProfile(userId, email);
    const tool = getToolById(toolId);

    if (!tool) {
      return {
        allowed: false,
        reason: 'tool_not_found',
      };
    }

    // Check rate limit
    const tierConfig = TIER_CONFIGS[profile.tierLevel];
    const today = new Date().toISOString().split('T')[0];
    
    if (profile.lastRequestDate === today && profile.requestsToday >= tierConfig.maxRequestsPerDay) {
      return {
        allowed: false,
        reason: 'rate_limit',
        blockedTool: tool,
        upgradePrompt: `Daily limit reached (${tierConfig.maxRequestsPerDay}). Upgrade to increase limits.`,
        upgradeUrl: `/upgrade?tier=${this.getNextTier(profile.tierLevel)}`,
      };
    }

    // Check tier access
    const access = canAccessTool(profile.tierLevel, toolId);

    if (!access.allowed) {
      return {
        allowed: false,
        reason: 'tier_mismatch',
        blockedTool: tool,
        suggestedAlternative: access.alternative,
        upgradePrompt: access.upgradeMessage,
        upgradeUrl: `/upgrade?tier=${tool.tierRequired}`,
      };
    }

    // Update usage
    await this.incrementUsage(userId, today, profile);

    return {
      allowed: true,
      tool,
      remainingRequests: tierConfig.maxRequestsPerDay - profile.requestsToday - 1,
    };
  }

  /**
   * Check access for an Ingot (multiple tools)
   */
  async checkIngotAccess(
    userId: string,
    email: string,
    toolIds: string[]
  ): Promise<{ allowed: boolean; results: Map<string, PaywallResult>; alternatives: ToolProfile[] }> {
    const profile = await this.getOrCreateProfile(userId, email);
    const tierConfig = TIER_CONFIGS[profile.tierLevel];

    // Check tool count limit
    if (toolIds.length > tierConfig.maxToolsPerIngot) {
      return {
        allowed: false,
        results: new Map(),
        alternatives: [],
      };
    }

    const results = new Map<string, PaywallResult>();
    const alternatives: ToolProfile[] = [];
    let allAllowed = true;

    for (const toolId of toolIds) {
      const result = await this.checkToolAccess(userId, email, toolId);
      results.set(toolId, result);

      if (!result.allowed) {
        allAllowed = false;
        if (result.suggestedAlternative) {
          alternatives.push(result.suggestedAlternative);
        }
      }
    }

    return { allowed: allAllowed, results, alternatives };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ───────────────────────────────────────────────────────────────────────────

  private async incrementUsage(userId: string, today: string, profile: UserProfile): Promise<void> {
    const isNewDay = today !== profile.lastRequestDate;
    
    const updatedProfile: UserProfile = {
      ...profile,
      requestsToday: isNewDay ? 1 : profile.requestsToday + 1,
      lastRequestDate: today,
      totalRequests: profile.totalRequests + 1,
      updatedAt: new Date().toISOString(),
    };

    try {
      const endpoint = buildFirestoreEndpoint(this.COLLECTION, userId);
      const headers = await getAuthHeaders();

      await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: profileToFirestoreFields(updatedProfile) }),
      });
    } catch (error) {
      console.error('[PaywallService] Error incrementing usage:', error);
    }
  }

  private getNextTier(current: TierLevel): TierLevel {
    const order: TierLevel[] = ['free', 'data_entry', 'enterprise'];
    const index = order.indexOf(current);
    return order[Math.min(index + 1, order.length - 1)];
  }

  /**
   * Get tier comparison for upgrade prompts
   */
  getTierComparison(fromTier: TierLevel, toTier: TierLevel): {
    priceDiff: number;
    newCapabilities: CapabilityVertical[];
    newToolCount: number;
    newRequestLimit: number;
  } {
    const from = TIER_CONFIGS[fromTier];
    const to = TIER_CONFIGS[toTier];

    return {
      priceDiff: to.pricePerMonth - from.pricePerMonth,
      newCapabilities: to.capabilities.filter(c => !from.capabilities.includes(c)),
      newToolCount: to.maxToolsPerIngot - from.maxToolsPerIngot,
      newRequestLimit: to.maxRequestsPerDay - from.maxRequestsPerDay,
    };
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let paywallServiceInstance: PaywallService | null = null;

export function getPaywallService(): PaywallService {
  if (!paywallServiceInstance) {
    paywallServiceInstance = new PaywallService();
  }
  return paywallServiceInstance;
}

// =============================================================================
// ACHEEVY INTEGRATION HOOK
// =============================================================================

/**
 * ACHEEVY Paywall Check
 * Called by ACHEEVY agent before tool execution
 */
export async function acheevyPaywallCheck(
  userId: string,
  email: string,
  toolId: string
): Promise<{
  proceed: boolean;
  alternativeToolId?: string;
  userMessage?: string;
}> {
  const service = getPaywallService();
  const result = await service.checkToolAccess(userId, email, toolId);

  if (result.allowed) {
    return { proceed: true };
  }

  // Build user-friendly message
  let message = '';
  
  if (result.suggestedAlternative) {
    message = `The tool "${result.blockedTool?.visualName}" requires an upgrade. ` +
      `Using free alternative: "${result.suggestedAlternative.visualName}" instead.`;
    
    return {
      proceed: true,
      alternativeToolId: result.suggestedAlternative.toolId,
      userMessage: message,
    };
  }

  message = `${result.upgradePrompt}\n\nUpgrade at: ${result.upgradeUrl}`;
  
  return {
    proceed: false,
    userMessage: message,
  };
}
