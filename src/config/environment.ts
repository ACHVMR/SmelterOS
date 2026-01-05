/**
 * SmelterOS Environment Configuration
 * Centralized secrets and environment management
 * 
 * NEVER commit actual secrets - use .env.local or Secret Manager
 */

// =============================================================================
// ENVIRONMENT TYPES
// =============================================================================

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  // Core
  environment: Environment;
  version: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  // Server
  server: {
    port: number;
    host: string;
    corsOrigins: string[];
    trustProxy: boolean;
  };
  
  // GCP
  gcp: {
    projectId: string;
    projectNumber: string;
    region: string;
    zone: string;
    serviceAccountEmail: string;
    credentials?: string; // Path to service account JSON
  };
  
  // Firebase / Auth
  firebase: {
    projectId: string;
    apiKey: string;
    authDomain: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  
  // Database
  database: {
    firestore: {
      projectId: string;
      databaseId: string;
    };
    postgresql: {
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
      ssl: boolean;
      poolSize: number;
      connectionTimeout: number;
    };
  };
  
  // Redis / Cache
  redis: {
    url: string;
    password?: string;
    tls: boolean;
    keyPrefix: string;
    defaultTtlSeconds: number;
  };
  
  // AI / ML
  ai: {
    openai: {
      apiKey: string;
      organization?: string;
      model: string;
      maxTokens: number;
    };
    anthropic: {
      apiKey: string;
      model: string;
      maxTokens: number;
    };
    vertexAi: {
      projectId: string;
      location: string;
      model: string;
    };
  };
  
  // Voice
  voice: {
    elevenlabs: {
      apiKey: string;
      voiceId: string;
      modelId: string;
    };
    deepgram: {
      apiKey: string;
      model: string;
    };
  };
  
  // Integrations
  integrations: {
    github: {
      appId: string;
      privateKey: string;
      webhookSecret: string;
      clientId: string;
      clientSecret: string;
    };
    stripe: {
      secretKey: string;
      publishableKey: string;
      webhookSecret: string;
      priceIds: {
        starter: string;
        professional: string;
        enterprise: string;
      };
    };
    cloudflare: {
      apiToken: string;
      accountId: string;
      zoneId?: string;
    };
    slack: {
      botToken: string;
      signingSecret: string;
      appToken: string;
    };
  };
  
  // Security
  security: {
    jwtSecret: string;
    jwtExpiresIn: string;
    refreshTokenExpiresIn: string;
    bcryptRounds: number;
    rateLimitEnabled: boolean;
    corsEnabled: boolean;
  };
  
  // Feature Flags
  features: {
    voiceEnabled: boolean;
    vibeValidationEnabled: boolean;
    whiteLabelEnabled: boolean;
    analyticsEnabled: boolean;
    debugMode: boolean;
  };
  
  // Circuit Breaker Settings (MANDATORY)
  circuitBreaker: {
    errorThreshold: number;      // Default: 5
    cooldownMs: number;          // Default: 30000
    autoResetEnabled: boolean;   // MUST be true
    latencyThresholdMs: number;  // Default: 50
  };
}

// =============================================================================
// ENVIRONMENT LOADER
// =============================================================================

/**
 * Load environment variable with type safety
 */
function env(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    console.warn(`[ENV] Missing environment variable: ${key}`);
    return '';
  }
  return value;
}

function envInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function envBool(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

function envArray(key: string, defaultValue: string[] = []): string[] {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

// =============================================================================
// CONFIGURATION BUILDER
// =============================================================================

export function buildConfig(): EnvironmentConfig {
  const environment = (env('NODE_ENV', 'development') as Environment);
  
  return {
    environment,
    version: env('npm_package_version', '2.1.0'),
    logLevel: (env('LOG_LEVEL', environment === 'production' ? 'info' : 'debug') as EnvironmentConfig['logLevel']),
    
    server: {
      port: envInt('PORT', 8080),
      host: env('HOST', '0.0.0.0'),
      corsOrigins: envArray('CORS_ORIGINS', ['http://localhost:3000', 'http://localhost:5173']),
      trustProxy: envBool('TRUST_PROXY', environment === 'production'),
    },
    
    gcp: {
      projectId: env('GCP_PROJECT_ID', 'smelteros'),
      projectNumber: env('GCP_PROJECT_NUMBER', '722121007626'),
      region: env('GCP_REGION', 'us-central1'),
      zone: env('GCP_ZONE', 'us-central1-a'),
      serviceAccountEmail: env('GCP_SERVICE_ACCOUNT', ''),
      credentials: env('GOOGLE_APPLICATION_CREDENTIALS'),
    },
    
    firebase: {
      projectId: env('FIREBASE_PROJECT_ID', ''),
      apiKey: env('FIREBASE_API_KEY', ''),
      authDomain: env('FIREBASE_AUTH_DOMAIN', ''),
      storageBucket: env('FIREBASE_STORAGE_BUCKET', ''),
      messagingSenderId: env('FIREBASE_MESSAGING_SENDER_ID', ''),
      appId: env('FIREBASE_APP_ID', ''),
    },
    
    database: {
      firestore: {
        projectId: env('FIRESTORE_PROJECT_ID', env('GCP_PROJECT_ID', '')),
        databaseId: env('FIRESTORE_DATABASE_ID', '(default)'),
      },
      postgresql: {
        host: env('POSTGRES_HOST', 'localhost'),
        port: envInt('POSTGRES_PORT', 5432),
        database: env('POSTGRES_DB', 'smelter_os'),
        user: env('POSTGRES_USER', 'postgres'),
        password: env('POSTGRES_PASSWORD', ''),
        ssl: envBool('POSTGRES_SSL', environment === 'production'),
        poolSize: envInt('POSTGRES_POOL_SIZE', 10),
        connectionTimeout: envInt('POSTGRES_CONNECT_TIMEOUT', 5000),
      },
    },
    
    redis: {
      url: env('REDIS_URL', 'redis://localhost:6379'),
      password: env('REDIS_PASSWORD'),
      tls: envBool('REDIS_TLS', environment === 'production'),
      keyPrefix: env('REDIS_PREFIX', 'smelter:'),
      defaultTtlSeconds: envInt('REDIS_DEFAULT_TTL', 3600),
    },
    
    ai: {
      openai: {
        apiKey: env('OPENAI_API_KEY', ''),
        organization: env('OPENAI_ORG_ID'),
        model: env('OPENAI_MODEL', 'gpt-4-turbo-preview'),
        maxTokens: envInt('OPENAI_MAX_TOKENS', 4096),
      },
      anthropic: {
        apiKey: env('ANTHROPIC_API_KEY', ''),
        model: env('ANTHROPIC_MODEL', 'claude-3-opus-20240229'),
        maxTokens: envInt('ANTHROPIC_MAX_TOKENS', 4096),
      },
      vertexAi: {
        projectId: env('VERTEX_AI_PROJECT', env('GCP_PROJECT_ID', '')),
        location: env('VERTEX_AI_LOCATION', 'us-central1'),
        model: env('VERTEX_AI_MODEL', 'gemini-pro'),
      },
    },
    
    voice: {
      elevenlabs: {
        apiKey: env('ELEVENLABS_API_KEY', ''),
        voiceId: env('ELEVENLABS_VOICE_ID', ''),
        modelId: env('ELEVENLABS_MODEL_ID', 'eleven_monolingual_v1'),
      },
      deepgram: {
        apiKey: env('DEEPGRAM_API_KEY', ''),
        model: env('DEEPGRAM_MODEL', 'nova-2'),
      },
    },
    
    integrations: {
      github: {
        appId: env('GITHUB_APP_ID', ''),
        privateKey: env('GITHUB_PRIVATE_KEY', ''),
        webhookSecret: env('GITHUB_WEBHOOK_SECRET', ''),
        clientId: env('GITHUB_CLIENT_ID', ''),
        clientSecret: env('GITHUB_CLIENT_SECRET', ''),
      },
      stripe: {
        secretKey: env('STRIPE_SECRET_KEY', ''),
        publishableKey: env('STRIPE_PUBLISHABLE_KEY', ''),
        webhookSecret: env('STRIPE_WEBHOOK_SECRET', ''),
        priceIds: {
          starter: env('STRIPE_PRICE_STARTER', ''),
          professional: env('STRIPE_PRICE_PROFESSIONAL', ''),
          enterprise: env('STRIPE_PRICE_ENTERPRISE', ''),
        },
      },
      cloudflare: {
        apiToken: env('CLOUDFLARE_API_TOKEN', ''),
        accountId: env('CLOUDFLARE_ACCOUNT_ID', ''),
        zoneId: env('CLOUDFLARE_ZONE_ID'),
      },
      slack: {
        botToken: env('SLACK_BOT_TOKEN', ''),
        signingSecret: env('SLACK_SIGNING_SECRET', ''),
        appToken: env('SLACK_APP_TOKEN', ''),
      },
    },
    
    security: {
      // Generate fallback secret from GCP project ID + instance ID for Cloud Run
      jwtSecret: env('JWT_SECRET', 
        process.env.GCP_PROJECT_ID 
          ? `smelter-${process.env.GCP_PROJECT_ID}-${process.env.K_REVISION || 'local'}`
          : 'CHANGE_ME_IN_PRODUCTION'
      ),
      jwtExpiresIn: env('JWT_EXPIRES_IN', '1h'),
      refreshTokenExpiresIn: env('REFRESH_TOKEN_EXPIRES_IN', '7d'),
      bcryptRounds: envInt('BCRYPT_ROUNDS', 12),
      rateLimitEnabled: envBool('RATE_LIMIT_ENABLED', true),
      corsEnabled: envBool('CORS_ENABLED', true),
    },
    
    features: {
      voiceEnabled: envBool('FEATURE_VOICE', true),
      vibeValidationEnabled: envBool('FEATURE_VIBE_VALIDATION', true),
      whiteLabelEnabled: envBool('FEATURE_WHITE_LABEL', true),
      analyticsEnabled: envBool('FEATURE_ANALYTICS', true),
      debugMode: envBool('DEBUG_MODE', environment !== 'production'),
    },
    
    // MANDATORY Circuit Breaker Settings
    circuitBreaker: {
      errorThreshold: envInt('CIRCUIT_ERROR_THRESHOLD', 5),
      cooldownMs: envInt('CIRCUIT_COOLDOWN_MS', 30000),
      autoResetEnabled: true,  // ALWAYS TRUE - MANDATORY
      latencyThresholdMs: envInt('CIRCUIT_LATENCY_THRESHOLD_MS', 50),
    },
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateConfig(config: EnvironmentConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Critical for production
  if (config.environment === 'production') {
    if (!config.gcp.projectId) errors.push('GCP_PROJECT_ID is required');
    if (!config.security.jwtSecret || config.security.jwtSecret === 'CHANGE_ME_IN_PRODUCTION') {
      // Auto-generate JWT secret for Cloud Run (uses instance identity)
      warnings.push('JWT_SECRET not set - using auto-generated secret (not suitable for multi-instance without shared secret)');
    }
    // PostgreSQL is optional if Firestore is configured
    if (!config.database.postgresql.password && !config.database.firestore.projectId) {
      errors.push('Either POSTGRES_PASSWORD or FIRESTORE_PROJECT_ID is required in production');
    }
  }
  
  // Warnings for missing optional configs
  if (!config.ai.openai.apiKey && !config.ai.anthropic.apiKey) {
    warnings.push('No AI API keys configured - AI features will be disabled');
  }
  
  if (!config.voice.elevenlabs.apiKey) {
    warnings.push('ElevenLabs API key not set - voice synthesis disabled');
  }
  
  if (!config.voice.deepgram.apiKey) {
    warnings.push('Deepgram API key not set - voice transcription disabled');
  }
  
  if (!config.integrations.stripe.secretKey) {
    warnings.push('Stripe not configured - billing features disabled');
  }
  
  // Circuit breaker validation (MANDATORY)
  if (!config.circuitBreaker.autoResetEnabled) {
    errors.push('circuitBreaker.autoResetEnabled MUST be true - this is MANDATORY');
  }
  
  if (config.circuitBreaker.latencyThresholdMs > 50) {
    warnings.push(`Latency threshold ${config.circuitBreaker.latencyThresholdMs}ms exceeds target <50ms`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// SINGLETON
// =============================================================================

let cachedConfig: EnvironmentConfig | null = null;

export function getConfig(): EnvironmentConfig {
  if (!cachedConfig) {
    cachedConfig = buildConfig();
    const validation = validateConfig(cachedConfig);
    
    if (validation.warnings.length > 0) {
      console.warn('[Config] Warnings:');
      validation.warnings.forEach(w => console.warn(`  - ${w}`));
    }
    
    if (!validation.valid) {
      console.error('[Config] Errors:');
      validation.errors.forEach(e => console.error(`  - ${e}`));
      
      if (cachedConfig.environment === 'production') {
        throw new Error('Invalid configuration for production');
      }
    }
    
    console.log(`[Config] Loaded for ${cachedConfig.environment} environment`);
  }
  
  return cachedConfig;
}

export function resetConfig(): void {
  cachedConfig = null;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default getConfig;
