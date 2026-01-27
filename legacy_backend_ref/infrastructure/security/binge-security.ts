/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Binge Code Security Integration
 * Defense-Grade Security Pipeline for FDH-Driven Delivery
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECURITY TIER TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type SecurityTier = 'light' | 'medium' | 'heavy' | 'superior' | 'defense-grade';

export interface SecurityTierConfig {
  tier: SecurityTier;
  costMultiplier: number;
  scanners: ScannerType[];
  evidenceRequirements: EvidenceRequirement[];
  policyPackSize: number;
  attestationRequired: boolean;
  auditLogging: 'basic' | 'standard' | 'full' | 'real-time';
}

export type ScannerType =
  | 'sbom'           // Software Bill of Materials
  | 'sast'           // Static Application Security Testing
  | 'dast'           // Dynamic Application Security Testing
  | 'container'      // Container image scanning
  | 'dependency'     // Dependency vulnerability scanning
  | 'secrets'        // Secret detection
  | 'iac'            // Infrastructure as Code scanning
  | 'formal';        // Formal verification (subset)

export type EvidenceRequirement =
  | 'unit-tests'
  | 'integration-tests'
  | 'sbom-report'
  | 'sast-report'
  | 'dast-report'
  | 'coverage-report'
  | 'rls-proof'
  | 'audit-log-sample'
  | 'icar-links'
  | 'zero-downtime-test'
  | 'chaos-test'
  | 'performance-baseline'
  | 'security-cert'
  | 'corpus-attestation'
  | 'runtime-telemetry'
  | 'farmer-signoff'
  | 'ntntn-signoff';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECURITY TIER DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SECURITY_TIERS: Record<SecurityTier, SecurityTierConfig> = {
  light: {
    tier: 'light',
    costMultiplier: 1.0,
    scanners: ['sbom'],
    evidenceRequirements: ['unit-tests', 'sbom-report'],
    policyPackSize: 3,
    attestationRequired: false,
    auditLogging: 'basic',
  },
  medium: {
    tier: 'medium',
    costMultiplier: 1.3,
    scanners: ['sbom', 'sast', 'dast'],
    evidenceRequirements: [
      'unit-tests',
      'sbom-report',
      'sast-report',
      'dast-report',
      'coverage-report',
    ],
    policyPackSize: 10,
    attestationRequired: true,
    auditLogging: 'standard',
  },
  heavy: {
    tier: 'heavy',
    costMultiplier: 1.6,
    scanners: ['sbom', 'sast', 'dast', 'container', 'dependency'],
    evidenceRequirements: [
      'unit-tests',
      'integration-tests',
      'sbom-report',
      'sast-report',
      'dast-report',
      'coverage-report',
      'rls-proof',
      'audit-log-sample',
      'icar-links',
    ],
    policyPackSize: 20,
    attestationRequired: true,
    auditLogging: 'full',
  },
  superior: {
    tier: 'superior',
    costMultiplier: 2.0,
    scanners: ['sbom', 'sast', 'dast', 'container', 'dependency', 'secrets', 'iac'],
    evidenceRequirements: [
      'unit-tests',
      'integration-tests',
      'sbom-report',
      'sast-report',
      'dast-report',
      'coverage-report',
      'rls-proof',
      'audit-log-sample',
      'icar-links',
      'zero-downtime-test',
      'chaos-test',
      'performance-baseline',
      'security-cert',
    ],
    policyPackSize: 35,
    attestationRequired: true,
    auditLogging: 'real-time',
  },
  'defense-grade': {
    tier: 'defense-grade',
    costMultiplier: 2.5,
    scanners: ['sbom', 'sast', 'dast', 'container', 'dependency', 'secrets', 'iac', 'formal'],
    evidenceRequirements: [
      'unit-tests',
      'integration-tests',
      'sbom-report',
      'sast-report',
      'dast-report',
      'coverage-report',
      'rls-proof',
      'audit-log-sample',
      'icar-links',
      'zero-downtime-test',
      'chaos-test',
      'performance-baseline',
      'security-cert',
      'corpus-attestation',
      'runtime-telemetry',
      'farmer-signoff',
      'ntntn-signoff',
    ],
    policyPackSize: 50,
    attestationRequired: true,
    auditLogging: 'real-time',
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SURFACE MAP TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type SurfaceType =
  | 'private-app'      // Internal tenant application
  | 'marketplace'      // Public plugin gallery
  | 'embed'            // Embedded widget
  | 'disclosure'       // C2PA/consent surface
  | 'api';             // Public API

export interface SurfaceConfig {
  type: SurfaceType;
  exposed: boolean;
  rlsRequired: boolean;
  cspPolicy: 'strict' | 'standard' | 'relaxed';
  abusePrevention: boolean;
  contentModeration: boolean;
  minimumTier: SecurityTier;
}

export const SURFACE_CONFIGS: Record<SurfaceType, SurfaceConfig> = {
  'private-app': {
    type: 'private-app',
    exposed: false,
    rlsRequired: true,
    cspPolicy: 'standard',
    abusePrevention: false,
    contentModeration: false,
    minimumTier: 'light',
  },
  marketplace: {
    type: 'marketplace',
    exposed: true,
    rlsRequired: true,
    cspPolicy: 'strict',
    abusePrevention: true,
    contentModeration: true,
    minimumTier: 'heavy',
  },
  embed: {
    type: 'embed',
    exposed: true,
    rlsRequired: true,
    cspPolicy: 'strict',
    abusePrevention: true,
    contentModeration: false,
    minimumTier: 'medium',
  },
  disclosure: {
    type: 'disclosure',
    exposed: true,
    rlsRequired: true,
    cspPolicy: 'strict',
    abusePrevention: true,
    contentModeration: true,
    minimumTier: 'defense-grade',
  },
  api: {
    type: 'api',
    exposed: true,
    rlsRequired: true,
    cspPolicy: 'strict',
    abusePrevention: true,
    contentModeration: false,
    minimumTier: 'medium',
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HUDDLE CONTRACT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface HuddleContract {
  id: string;
  createdAt: Date;
  approvedAt?: Date;
  
  // Security Configuration
  securityTier: SecurityTier;
  surfaces: SurfaceType[];
  
  // Tenant Isolation
  tenantIsolation: {
    identitySource: 'supabase' | 'oauth' | 'custom';
    dataIsolation: 'rls' | 'app-level' | 'db-isolation';
    secretsFlow: 'vault-per-tenant' | 'shared-vault' | 'hsm';
  };
  
  // Policy Obligations
  policyObligations: PolicyObligation[];
  
  // Evidence Bundle
  evidenceBundle: EvidenceRequirement[];
  
  // Role Assignments
  roles: {
    acheevy: string;      // Orchestrator
    ntntn: string;        // Conscience
    farmer: string;       // Security Signer
    union: string;        // Policy Curator
    hitl?: string;        // Human in the Loop
  };
  
  // Effort Quote
  effortQuote: {
    baseTokens: number;
    tierMultiplier: number;
    surfaceMultiplier: number;
    estimatedTokens: number;
    estimatedCost: {
      min: number;
      max: number;
    };
    cyclesExpected: number;
  };
  
  // Approval Status
  approved: boolean;
  approvedBy?: string;
}

export interface PolicyObligation {
  id: string;
  name: string;
  type: 'harmful-use' | 'data-retention' | 'claims-realism' | 'ethics-bounds' | 'custom';
  rule: string;
  regoPolicy?: string;
  enforced: boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EVIDENCE BUNDLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface EvidenceBundle {
  id: string;
  huddleContractId: string;
  createdAt: Date;
  completedAt?: Date;
  
  // Evidence Items
  items: EvidenceItem[];
  
  // Completion Status
  requiredCount: number;
  completedCount: number;
  percentComplete: number;
  
  // Sign-offs
  signoffs: {
    farmer?: { signedAt: Date; signature: string };
    ntntn?: { signedAt: Date; signature: string };
  };
}

export interface EvidenceItem {
  type: EvidenceRequirement;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  artifactUrl?: string;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECURITY PIPELINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class SecurityPipeline {
  private tier: SecurityTierConfig;
  private surfaces: SurfaceConfig[];
  private contract?: HuddleContract;

  constructor(tier: SecurityTier, surfaces: SurfaceType[]) {
    this.tier = SECURITY_TIERS[tier];
    this.surfaces = surfaces.map((s) => SURFACE_CONFIGS[s]);
    
    // Validate surfaces against tier
    this.validateSurfaces();
  }

  /**
   * Validate that surfaces are compatible with tier
   */
  private validateSurfaces(): void {
    const tierOrder: SecurityTier[] = ['light', 'medium', 'heavy', 'superior', 'defense-grade'];
    const currentTierIndex = tierOrder.indexOf(this.tier.tier);

    for (const surface of this.surfaces) {
      const requiredTierIndex = tierOrder.indexOf(surface.minimumTier);
      if (currentTierIndex < requiredTierIndex) {
        throw new Error(
          `Surface "${surface.type}" requires minimum tier "${surface.minimumTier}", but current tier is "${this.tier.tier}"`
        );
      }
    }
  }

  /**
   * Create a new Huddle contract
   */
  createContract(options: {
    tenantIsolation: HuddleContract['tenantIsolation'];
    policyObligations: PolicyObligation[];
    roles: HuddleContract['roles'];
    baseTokens: number;
  }): HuddleContract {
    const surfaceMultiplier = 1 + (this.surfaces.length - 1) * 0.2;
    const estimatedTokens = Math.round(
      options.baseTokens * this.tier.costMultiplier * surfaceMultiplier
    );

    // Cost calculation (example: $0.027 per 1M tokens)
    const costPerMillion = 0.027;
    const baseCost = (estimatedTokens / 1_000_000) * costPerMillion;

    this.contract = {
      id: `contract-${Date.now()}`,
      createdAt: new Date(),
      securityTier: this.tier.tier,
      surfaces: this.surfaces.map((s) => s.type),
      tenantIsolation: options.tenantIsolation,
      policyObligations: options.policyObligations,
      evidenceBundle: this.tier.evidenceRequirements,
      roles: options.roles,
      effortQuote: {
        baseTokens: options.baseTokens,
        tierMultiplier: this.tier.costMultiplier,
        surfaceMultiplier,
        estimatedTokens,
        estimatedCost: {
          min: baseCost,
          max: baseCost * 3, // 1-3 cycles expected
        },
        cyclesExpected: 2,
      },
      approved: false,
    };

    return this.contract;
  }

  /**
   * Approve the contract
   */
  approveContract(approvedBy: string): void {
    if (!this.contract) {
      throw new Error('No contract to approve');
    }
    this.contract.approved = true;
    this.contract.approvedBy = approvedBy;
    this.contract.approvedAt = new Date();
  }

  /**
   * Get required scanners for this pipeline
   */
  getRequiredScanners(): ScannerType[] {
    return this.tier.scanners;
  }

  /**
   * Get required evidence for this pipeline
   */
  getRequiredEvidence(): EvidenceRequirement[] {
    return this.tier.evidenceRequirements;
  }

  /**
   * Create evidence bundle from contract
   */
  createEvidenceBundle(): EvidenceBundle {
    if (!this.contract) {
      throw new Error('No contract exists');
    }

    return {
      id: `evidence-${Date.now()}`,
      huddleContractId: this.contract.id,
      createdAt: new Date(),
      items: this.tier.evidenceRequirements.map((req) => ({
        type: req,
        status: 'pending' as const,
      })),
      requiredCount: this.tier.evidenceRequirements.length,
      completedCount: 0,
      percentComplete: 0,
      signoffs: {},
    };
  }

  /**
   * Validate evidence bundle is complete
   */
  validateEvidence(bundle: EvidenceBundle): {
    valid: boolean;
    missingItems: EvidenceRequirement[];
    missingSignoffs: string[];
  } {
    const completedItems = bundle.items.filter((i) => i.status === 'completed');
    const missingItems = this.tier.evidenceRequirements.filter(
      (req) => !completedItems.find((i) => i.type === req)
    );

    const missingSignoffs: string[] = [];
    if (this.tier.tier === 'defense-grade') {
      if (!bundle.signoffs.farmer) missingSignoffs.push('farmer');
      if (!bundle.signoffs.ntntn) missingSignoffs.push('ntntn');
    } else if (this.tier.attestationRequired && !bundle.signoffs.farmer) {
      missingSignoffs.push('farmer');
    }

    return {
      valid: missingItems.length === 0 && missingSignoffs.length === 0,
      missingItems,
      missingSignoffs,
    };
  }

  /**
   * Check if pipeline allows release
   */
  canRelease(bundle: EvidenceBundle): boolean {
    const validation = this.validateEvidence(bundle);
    return validation.valid;
  }

  /**
   * Get pipeline summary
   */
  getSummary(): {
    tier: SecurityTier;
    surfaces: SurfaceType[];
    scanners: ScannerType[];
    evidenceCount: number;
    policyCount: number;
    attestationRequired: boolean;
  } {
    return {
      tier: this.tier.tier,
      surfaces: this.surfaces.map((s) => s.type),
      scanners: this.tier.scanners,
      evidenceCount: this.tier.evidenceRequirements.length,
      policyCount: this.tier.policyPackSize,
      attestationRequired: this.tier.attestationRequired,
    };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ICAR LOGGING (Immutable Context-Aware Record)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ICARRecord {
  id: string;
  timestamp: Date;
  action: string;
  actor: string;
  resource: string;
  context: Record<string, unknown>;
  result: 'success' | 'failure' | 'pending';
  vibeScore?: number;
  evidenceLinks?: string[];
}

export class ICARLogger {
  private records: ICARRecord[] = [];

  log(record: Omit<ICARRecord, 'id' | 'timestamp'>): ICARRecord {
    const fullRecord: ICARRecord = {
      id: `icar-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(),
      ...record,
    };

    this.records.push(fullRecord);
    
    // In production, this would write to Cloud Logging / BigQuery
    console.log(`[ICAR] ${fullRecord.action} by ${fullRecord.actor}: ${fullRecord.result}`);

    return fullRecord;
  }

  getRecords(filter?: { actor?: string; resource?: string; result?: string }): ICARRecord[] {
    return this.records.filter((r) => {
      if (filter?.actor && r.actor !== filter.actor) return false;
      if (filter?.resource && r.resource !== filter.resource) return false;
      if (filter?.result && r.result !== filter.result) return false;
      return true;
    });
  }

  clear(): void {
    this.records = [];
  }
}

// Export singleton logger
export const icarLogger = new ICARLogger();
