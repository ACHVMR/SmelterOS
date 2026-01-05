# 🔥 Smelting Guide

> **Step-by-Step Execution Manual for the Foundry**

---

## Overview

This guide provides detailed instructions for executing the Smelting process. Every agent, every build, every deployment follows this protocol.

---

## Phase 1: Smelting (Build Phase)

### 1.1 Blueprint Acquisition

```typescript
// Load the Ingot blueprint
const blueprint = await InteractionsAPI.loadBlueprint('Locale');

// Blueprint contains:
// - Feature specifications
// - Data models
// - API endpoints
// - Infrastructure requirements
// - Resource dependencies
```

### 1.2 Resource Allocation

```typescript
// Determine required resources
const resources = blueprint.requiredResources;
// e.g., ['ii-researcher', 'ii-agent']

// Validate resource availability
for (const resource of resources) {
  await ResourceRouter.validate(resource);
}
```

### 1.3 Context Loading (Vault Access)

```typescript
// Load context from Google File Manager RAG
const context = await FileManagerRAG.retrieve({
  ingot: 'Locale',
  contextTypes: ['standards', 'product-specs', 'technical-docs'],
  relevanceThreshold: 0.8,
});

// Context is now available for the Smelting process
SmeltingContext.inject(context);
```

### 1.4 Machinery Engagement

```typescript
// Initialize Interactions API session
const session = await InteractionsAPI.createSession({
  ingot: 'Locale',
  phase: 'smelt',
  resources: resources,
  context: context,
});

// Engage Function Gemma T5 for tool execution
const toolchain = await FunctionGemmaT5.initialize({
  session: session.id,
  tools: blueprint.requiredTools,
});
```

### 1.5 Code Generation

```typescript
// Execute smelting tasks
for (const task of blueprint.smeltingTasks) {
  const result = await toolchain.execute({
    task: task,
    model: 'gemma-t5-xxl',
    temperature: 0.2, // Low for precision
  });
  
  await session.recordArtifact(result);
}
```

### 1.6 Infrastructure Provisioning

```typescript
// Deploy to GCP stack
await GCPProvisioner.deploy({
  project: 'smelteros',
  services: blueprint.infrastructure,
  priority: ['firebase', 'vertex-ai', 'cloud-run'],
});
```

---

## Phase 2: Gilding (Polish Phase)

### 2.1 UI Assembly

```typescript
// Load UI specifications
const uiSpec = blueprint.gildingSpec.ui;

// Generate UI components
const components = await FunctionGemmaT5.execute({
  tool: 'generateUIComponents',
  parameters: {
    framework: 'react',
    spec: uiSpec,
    designSystem: 'smelter-ui',
  },
});
```

### 2.2 Branding Application

```typescript
// Apply brand assets
await GildingEngine.applyBranding({
  ingot: 'Locale',
  colors: blueprint.brand.colors,
  typography: blueprint.brand.fonts,
  assets: blueprint.brand.assets,
});
```

### 2.3 Quality Assurance

```typescript
// Run quality gates
const qaResults = await QualityGate.run({
  ingot: 'Locale',
  checks: [
    'accessibility',
    'performance',
    'security',
    'ux-guidelines',
  ],
});

if (!qaResults.passed) {
  throw new GildingError('Quality gate failed', qaResults.failures);
}
```

### 2.4 Deployment

```typescript
// Deploy gilded product
await DeploymentPipeline.deploy({
  ingot: 'Locale',
  environment: 'production',
  platform: 'firebase-hosting',
  canary: true, // Progressive rollout
});
```

---

## API Reference

### Interactions API

The main conduit for all Foundry operations.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/interactions/dispatch` | POST | Dispatch a task to the Foundry |
| `/api/interactions/status` | GET | Get task status |
| `/api/interactions/session` | POST | Create a Smelting session |
| `/api/vault/retrieve` | POST | Retrieve context from RAG |
| `/api/resources/dispatch` | POST | Dispatch to II repository |

### Function Gemma T5 Tools

Available tools for structured execution.

| Tool | Purpose | Example |
|------|---------|---------|
| `createFirestoreCollection` | Create Firestore collection | `{ collection: 'users', schema: {...} }` |
| `deployCloudFunction` | Deploy Cloud Function | `{ name: 'processOrder', runtime: 'nodejs20' }` |
| `generateUIComponents` | Generate React components | `{ spec: {...}, framework: 'react' }` |
| `createVertexEndpoint` | Create Vertex AI endpoint | `{ model: 'gemini-pro', region: 'us-central1' }` |
| `configureFirebaseAuth` | Configure auth providers | `{ providers: ['google', 'email'] }` |

### Resource Router

Dispatch to Intelligent Internet repositories.

```typescript
interface ResourceDispatch {
  resource: 'ii-agent' | 'ii-researcher' | 'ii-thought' | 'II-Commons' | 'CoT-Lab-Demo';
  task: string;
  ingot: string;
  parameters?: Record<string, unknown>;
  callback?: string;
}
```

---

## Error Handling

### Smelting Errors

```typescript
class SmeltingError extends Error {
  constructor(
    message: string,
    public readonly phase: 'smelt' | 'gild',
    public readonly ingot: string,
    public readonly recoverable: boolean,
  ) {
    super(message);
  }
}
```

### Recovery Protocol

1. Log error to Cloud Logging
2. If recoverable, retry with backoff
3. If not recoverable, alert and rollback
4. Persist error context for debugging

---

## Monitoring

### Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Smelting Duration | < 30s | > 60s |
| Gilding Duration | < 15s | > 30s |
| RAG Retrieval Latency | < 100ms | > 500ms |
| Tool Execution Success | > 99% | < 95% |

### Dashboard

Cloud Monitoring dashboard: `smelteros-foundry-metrics`

---

## Examples

### Complete Smelting Flow

```typescript
// Smelt the Locale Ingot
async function smeltLocale() {
  // 1. Load blueprint
  const blueprint = await InteractionsAPI.loadBlueprint('Locale');
  
  // 2. Access vault
  const context = await FileManagerRAG.retrieve({
    ingot: 'Locale',
    contextTypes: ['standards', 'product-specs'],
  });
  
  // 3. Create session
  const session = await InteractionsAPI.createSession({
    ingot: 'Locale',
    phase: 'smelt',
    context,
  });
  
  // 4. Execute with Function Gemma T5
  const artifacts = await FunctionGemmaT5.executeBlueprint({
    session: session.id,
    blueprint,
  });
  
  // 5. Deploy infrastructure
  await GCPProvisioner.deploy({
    project: 'smelteros',
    artifacts,
  });
  
  // 6. Apply gilding
  await GildingEngine.apply({
    session: session.id,
    spec: blueprint.gildingSpec,
  });
  
  // 7. Deploy to production
  await DeploymentPipeline.deploy({
    ingot: 'Locale',
    environment: 'production',
  });
  
  return { success: true, session: session.id };
}
```

---

*Forge with precision. Gild with care. Ship with confidence.*
