/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS GCP Configuration
 * Central GCP Project Configuration for AVVA NOON Consciousness
 * Production-Grade API Coverage for 100 AI Plug Business Applications
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * API Tiers:
 * - core: Required for all operations (infrastructure, compute, storage)
 * - consciousness: AI/ML capabilities (Vertex AI, NLP, Vision, Speech)
 * - security: Governance, encryption, access control
 * - analytics: Observability, monitoring, business intelligence
 * - persistence: Databases, caching, data management
 * - content: Media processing, document handling
 * - integration: External connectivity, workflows
 * - optional: Specialized services for specific verticals
 * 
 * Total APIs: 116 (Full AI Plug ecosystem coverage)
 */

export interface GCPProjectConfig {
  projectId: string;
  projectNumber: string;
  region: string;
  zone: string;
  environment: 'development' | 'staging' | 'production';
}

export interface GCPServiceConfig {
  name: string;
  displayName: string;
  apiId: string;
  required: boolean;
  tier: 'core' | 'consciousness' | 'security' | 'analytics' | 'persistence' | 'content' | 'integration' | 'optional';
  description: string;
  useCases?: string[]; // AI Plug business use cases this API supports
}

/**
 * GCP Project Configuration
 * Project: gen-lang-client-0618301038 (SmelterOS Production)
 * Organization: achievemor.io
 */
export const GCP_PROJECT: GCPProjectConfig = {
  projectId: 'gen-lang-client-0618301038',
  projectNumber: '132049061623',
  region: 'us-central1',
  zone: 'us-central1-a',
  environment: 'production',
};

/**
 * All 116 GCP APIs enabled for SmelterOS
 * Organized by consciousness layer for full AI Plug ecosystem
 */
export const GCP_SERVICES: GCPServiceConfig[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CORE INFRASTRUCTURE (20+ APIs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'cloudrun',
    displayName: 'Cloud Run Admin API',
    apiId: 'run.googleapis.com',
    required: true,
    tier: 'core',
    description: 'Serverless container hosting for SmelterOS services',
  },
  {
    name: 'cloudfunctions',
    displayName: 'Cloud Functions API',
    apiId: 'cloudfunctions.googleapis.com',
    required: true,
    tier: 'core',
    description: 'Serverless functions for event-driven processing',
  },
  {
    name: 'cloudbuild',
    displayName: 'Cloud Build API',
    apiId: 'cloudbuild.googleapis.com',
    required: true,
    tier: 'core',
    description: 'CI/CD pipeline for automated deployments',
  },
  {
    name: 'compute',
    displayName: 'Compute Engine API',
    apiId: 'compute.googleapis.com',
    required: true,
    tier: 'core',
    description: 'VM instances for heavy workloads',
  },
  {
    name: 'appengine',
    displayName: 'App Engine Admin API',
    apiId: 'appengine.googleapis.com',
    required: false,
    tier: 'core',
    description: 'Legacy app hosting',
  },
  {
    name: 'storage',
    displayName: 'Cloud Storage API',
    apiId: 'storage.googleapis.com',
    required: true,
    tier: 'core',
    description: 'Object storage for assets and artifacts',
  },
  {
    name: 'storageapi',
    displayName: 'Cloud Storage JSON API',
    apiId: 'storage-api.googleapis.com',
    required: true,
    tier: 'core',
    description: 'JSON API for Cloud Storage operations',
  },
  {
    name: 'storagecomponent',
    displayName: 'Cloud Storage Component',
    apiId: 'storage-component.googleapis.com',
    required: true,
    tier: 'core',
    description: 'Core storage component',
  },
  {
    name: 'pubsub',
    displayName: 'Cloud Pub/Sub API',
    apiId: 'pubsub.googleapis.com',
    required: true,
    tier: 'core',
    description: 'Event messaging for ACP protocol and BAMARAM signals',
  },
  {
    name: 'cloudscheduler',
    displayName: 'Cloud Scheduler API',
    apiId: 'cloudscheduler.googleapis.com',
    required: true,
    tier: 'core',
    description: 'Scheduled jobs for LLL loop and evidence collection',
  },
  {
    name: 'cloudtasks',
    displayName: 'Cloud Tasks API',
    apiId: 'cloudtasks.googleapis.com',
    required: true,
    tier: 'core',
    description: 'Task queues for BoomerAng work distribution',
  },
  {
    name: 'eventarc',
    displayName: 'Eventarc API',
    apiId: 'eventarc.googleapis.com',
    required: true,
    tier: 'core',
    description: 'Event routing for consciousness triggers',
  },
  {
    name: 'batch',
    displayName: 'Batch API',
    apiId: 'batch.googleapis.com',
    required: false,
    tier: 'core',
    description: 'Batch processing for large-scale jobs',
  },
  {
    name: 'autoscaling',
    displayName: 'Cloud Autoscaling API',
    apiId: 'autoscaling.googleapis.com',
    required: true,
    tier: 'core',
    description: 'Auto-scaling for compute resources',
  },
  {
    name: 'cloudresourcemanager',
    displayName: 'Cloud Resource Manager API',
    apiId: 'cloudresourcemanager.googleapis.com',
    required: true,
    tier: 'core',
    description: 'Project and resource management',
  },
  {
    name: 'servicemanagement',
    displayName: 'Service Management API',
    apiId: 'servicemanagement.googleapis.com',
    required: true,
    tier: 'core',
    description: 'Service lifecycle management',
  },
  {
    name: 'serviceusage',
    displayName: 'Service Usage API',
    apiId: 'serviceusage.googleapis.com',
    required: true,
    tier: 'core',
    description: 'API enablement and usage tracking',
  },
  {
    name: 'cloudapis',
    displayName: 'Google Cloud APIs',
    apiId: 'cloudapis.googleapis.com',
    required: true,
    tier: 'core',
    description: 'Core Google Cloud API infrastructure',
  },
  {
    name: 'runtimeconfig',
    displayName: 'Cloud Runtime Configuration API',
    apiId: 'runtimeconfig.googleapis.com',
    required: false,
    tier: 'core',
    description: 'Runtime configuration management',
  },
  {
    name: 'deploymentmanager',
    displayName: 'Cloud Deployment Manager V2 API',
    apiId: 'deploymentmanager.googleapis.com',
    required: false,
    tier: 'core',
    description: 'Infrastructure as code deployments',
  },
  {
    name: 'dns',
    displayName: 'Cloud DNS API',
    apiId: 'dns.googleapis.com',
    required: false,
    tier: 'core',
    description: 'DNS management',
  },
  {
    name: 'networkconnectivity',
    displayName: 'Network Connectivity API',
    apiId: 'networkconnectivity.googleapis.com',
    required: false,
    tier: 'core',
    description: 'Network connectivity management',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // AI & CONSCIOUSNESS (9 APIs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'aiplatform',
    displayName: 'Vertex AI API',
    apiId: 'aiplatform.googleapis.com',
    required: true,
    tier: 'consciousness',
    description: 'Core AI platform - Gemini, embeddings, model training',
    useCases: ['AI copywriting', 'Content generation', 'Code assistants', 'Custom models'],
  },
  {
    name: 'generativelanguage',
    displayName: 'Generative Language API',
    apiId: 'generativelanguage.googleapis.com',
    required: true,
    tier: 'consciousness',
    description: 'Gemini API for text generation',
    useCases: ['Chatbots', 'Content creation', 'Summarization'],
  },
  {
    name: 'cloudaicompanion',
    displayName: 'Gemini for Google Cloud API',
    apiId: 'cloudaicompanion.googleapis.com',
    required: false,
    tier: 'consciousness',
    description: 'Gemini Code Assist and Duet AI features',
  },
  {
    name: 'dialogflow',
    displayName: 'Dialogflow API',
    apiId: 'dialogflow.googleapis.com',
    required: true,
    tier: 'consciousness',
    description: 'Conversational AI for ACHEEVY and virtual agents',
    useCases: ['Customer support bots', 'Voice assistants', 'IVR systems'],
  },
  {
    name: 'language',
    displayName: 'Cloud Natural Language API',
    apiId: 'language.googleapis.com',
    required: true,
    tier: 'consciousness',
    description: 'NLP for sentiment analysis and entity extraction',
    useCases: ['Review analysis', 'Content moderation', 'Topic classification'],
  },
  {
    name: 'speech',
    displayName: 'Cloud Speech-to-Text API',
    apiId: 'speech.googleapis.com',
    required: true,
    tier: 'consciousness',
    description: 'Voice input processing for ACHEEVY',
    useCases: ['Voice commands', 'Transcription', 'Call analytics'],
  },
  {
    name: 'texttospeech',
    displayName: 'Cloud Text-to-Speech API',
    apiId: 'texttospeech.googleapis.com',
    required: true,
    tier: 'consciousness',
    description: 'Voice output for consciousness responses',
    useCases: ['Voice assistants', 'Audiobook generation', 'Accessibility'],
  },
  {
    name: 'translate',
    displayName: 'Cloud Translation API',
    apiId: 'translate.googleapis.com',
    required: true,
    tier: 'consciousness',
    description: 'Multi-language consciousness support',
    useCases: ['Localization', 'Real-time translation', 'Document translation'],
  },
  {
    name: 'automl',
    displayName: 'Cloud AutoML API',
    apiId: 'automl.googleapis.com',
    required: false,
    tier: 'consciousness',
    description: 'Custom ML model training without code',
    useCases: ['Custom classifiers', 'Domain-specific models'],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VISION & DOCUMENT PROCESSING (4 APIs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'vision',
    displayName: 'Cloud Vision API',
    apiId: 'vision.googleapis.com',
    required: true,
    tier: 'consciousness',
    description: 'Image analysis and OCR for VL-JEPA',
    useCases: ['Product image analysis', 'Face detection', 'Logo detection'],
  },
  {
    name: 'videointelligence',
    displayName: 'Cloud Video Intelligence API',
    apiId: 'videointelligence.googleapis.com',
    required: true,
    tier: 'consciousness',
    description: 'Video analysis and content understanding',
    useCases: ['Video moderation', 'Content tagging', 'Object tracking'],
  },
  {
    name: 'documentai',
    displayName: 'Cloud Document AI API',
    apiId: 'documentai.googleapis.com',
    required: true,
    tier: 'consciousness',
    description: 'Document processing and extraction',
    useCases: ['Invoice processing', 'Contract analysis', 'Form extraction'],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SECURITY & IDENTITY (5 APIs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'secretmanager',
    displayName: 'Secret Manager API',
    apiId: 'secretmanager.googleapis.com',
    required: true,
    tier: 'security',
    description: 'Secure storage for API keys and tenant secrets',
  },
  {
    name: 'iam',
    displayName: 'Identity and Access Management API',
    apiId: 'iam.googleapis.com',
    required: true,
    tier: 'security',
    description: 'Identity and access management for 8-gate governance',
  },
  {
    name: 'iamcredentials',
    displayName: 'IAM Service Account Credentials API',
    apiId: 'iamcredentials.googleapis.com',
    required: true,
    tier: 'security',
    description: 'Service account credential management',
  },
  {
    name: 'identitytoolkit',
    displayName: 'Identity Toolkit API',
    apiId: 'identitytoolkit.googleapis.com',
    required: true,
    tier: 'security',
    description: 'Firebase Auth and Identity Platform',
    useCases: ['User authentication', 'OAuth providers', 'MFA'],
  },
  {
    name: 'cloudidentity',
    displayName: 'Cloud Identity API',
    apiId: 'cloudidentity.googleapis.com',
    required: false,
    tier: 'security',
    description: 'Enterprise identity management',
  },
  {
    name: 'securetoken',
    displayName: 'Token Service API',
    apiId: 'securetoken.googleapis.com',
    required: true,
    tier: 'security',
    description: 'Token generation and validation',
  },
  {
    name: 'oslogin',
    displayName: 'Cloud OS Login API',
    apiId: 'oslogin.googleapis.com',
    required: false,
    tier: 'security',
    description: 'SSH key management for VMs',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ANALYTICS & OBSERVABILITY (8 APIs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'logging',
    displayName: 'Cloud Logging API',
    apiId: 'logging.googleapis.com',
    required: true,
    tier: 'analytics',
    description: 'Centralized logging for ICAR audit trails',
  },
  {
    name: 'monitoring',
    displayName: 'Cloud Monitoring API',
    apiId: 'monitoring.googleapis.com',
    required: true,
    tier: 'analytics',
    description: 'Metrics and alerting for V.I.B.E. thresholds',
  },
  {
    name: 'cloudtrace',
    displayName: 'Cloud Trace API',
    apiId: 'cloudtrace.googleapis.com',
    required: true,
    tier: 'analytics',
    description: 'Distributed tracing for FDH pipeline observability',
  },
  {
    name: 'errorreporting',
    displayName: 'Error Reporting API',
    apiId: 'clouderrorreporting.googleapis.com',
    required: true,
    tier: 'analytics',
    description: 'Error tracking and halt condition monitoring',
  },
  {
    name: 'youtubeanalytics',
    displayName: 'YouTube Analytics API',
    apiId: 'youtubeanalytics.googleapis.com',
    required: false,
    tier: 'analytics',
    description: 'YouTube channel and video analytics',
    useCases: ['Video performance', 'Audience insights', 'Revenue tracking'],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BIGQUERY SUITE (8 APIs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'bigquery',
    displayName: 'BigQuery API',
    apiId: 'bigquery.googleapis.com',
    required: true,
    tier: 'analytics',
    description: 'Analytics warehouse for V.I.B.E. metrics and business intelligence',
    useCases: ['Marketing analytics', 'Financial reports', 'User behavior'],
  },
  {
    name: 'bigquerystorage',
    displayName: 'BigQuery Storage API',
    apiId: 'bigquerystorage.googleapis.com',
    required: true,
    tier: 'analytics',
    description: 'High-speed BigQuery data access',
  },
  {
    name: 'bigqueryconnection',
    displayName: 'BigQuery Connection API',
    apiId: 'bigqueryconnection.googleapis.com',
    required: false,
    tier: 'analytics',
    description: 'External data source connections',
  },
  {
    name: 'bigquerydatapolicy',
    displayName: 'BigQuery Data Policy API',
    apiId: 'bigquerydatapolicy.googleapis.com',
    required: false,
    tier: 'analytics',
    description: 'Data governance policies',
  },
  {
    name: 'bigquerydatatransfer',
    displayName: 'BigQuery Data Transfer API',
    apiId: 'bigquerydatatransfer.googleapis.com',
    required: false,
    tier: 'analytics',
    description: 'Automated data ingestion',
  },
  {
    name: 'bigquerymigration',
    displayName: 'BigQuery Migration API',
    apiId: 'bigquerymigration.googleapis.com',
    required: false,
    tier: 'analytics',
    description: 'Data warehouse migration',
  },
  {
    name: 'bigqueryreservation',
    displayName: 'BigQuery Reservation API',
    apiId: 'bigqueryreservation.googleapis.com',
    required: false,
    tier: 'analytics',
    description: 'Capacity management',
  },
  {
    name: 'analyticshub',
    displayName: 'Analytics Hub API',
    apiId: 'analyticshub.googleapis.com',
    required: false,
    tier: 'analytics',
    description: 'Data exchange and sharing',
  },
  {
    name: 'looker',
    displayName: 'Looker API',
    apiId: 'looker.googleapis.com',
    required: false,
    tier: 'analytics',
    description: 'Business intelligence dashboards',
    useCases: ['Executive dashboards', 'Self-service analytics'],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PERSISTENCE & DATABASES (6 APIs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'firestore',
    displayName: 'Cloud Firestore API',
    apiId: 'firestore.googleapis.com',
    required: true,
    tier: 'persistence',
    description: 'NoSQL document database for real-time state',
  },
  {
    name: 'datastore',
    displayName: 'Cloud Datastore API',
    apiId: 'datastore.googleapis.com',
    required: false,
    tier: 'persistence',
    description: 'Legacy NoSQL datastore',
  },
  {
    name: 'sqladmin',
    displayName: 'Cloud SQL Admin API',
    apiId: 'sqladmin.googleapis.com',
    required: true,
    tier: 'persistence',
    description: 'Managed PostgreSQL/MySQL for relational data',
  },
  {
    name: 'sqlcomponent',
    displayName: 'Cloud SQL Component',
    apiId: 'sql-component.googleapis.com',
    required: true,
    tier: 'persistence',
    description: 'Core SQL component',
  },
  {
    name: 'redis',
    displayName: 'Cloud Memorystore for Redis API',
    apiId: 'redis.googleapis.com',
    required: true,
    tier: 'persistence',
    description: 'In-memory caching for L2 cache layer',
  },
  {
    name: 'alloydb',
    displayName: 'AlloyDB API',
    apiId: 'alloydb.googleapis.com',
    required: false,
    tier: 'persistence',
    description: 'PostgreSQL-compatible for high-performance workloads',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CONTAINER & ARTIFACT MANAGEMENT (6 APIs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'artifactregistry',
    displayName: 'Artifact Registry API',
    apiId: 'artifactregistry.googleapis.com',
    required: true,
    tier: 'core',
    description: 'Docker and npm package storage',
  },
  {
    name: 'containerregistry',
    displayName: 'Container Registry API',
    apiId: 'containerregistry.googleapis.com',
    required: false,
    tier: 'core',
    description: 'Legacy container registry',
  },
  {
    name: 'container',
    displayName: 'Kubernetes Engine API',
    apiId: 'container.googleapis.com',
    required: false,
    tier: 'core',
    description: 'GKE for container orchestration',
  },
  {
    name: 'containeranalysis',
    displayName: 'Container Analysis API',
    apiId: 'containeranalysis.googleapis.com',
    required: false,
    tier: 'core',
    description: 'Container vulnerability scanning',
  },
  {
    name: 'containerfilesystem',
    displayName: 'Container File System API',
    apiId: 'containerfilesystem.googleapis.com',
    required: false,
    tier: 'core',
    description: 'Container filesystem operations',
  },
  {
    name: 'gkebackup',
    displayName: 'Backup for GKE API',
    apiId: 'gkebackup.googleapis.com',
    required: false,
    tier: 'core',
    description: 'GKE backup and restore',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DATA MANAGEMENT (4 APIs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'dataform',
    displayName: 'Dataform API',
    apiId: 'dataform.googleapis.com',
    required: false,
    tier: 'integration',
    description: 'SQL-based data transformation',
  },
  {
    name: 'dataplex',
    displayName: 'Cloud Dataplex API',
    apiId: 'dataplex.googleapis.com',
    required: false,
    tier: 'integration',
    description: 'Data lake management',
  },
  {
    name: 'notebooks',
    displayName: 'Notebooks API',
    apiId: 'notebooks.googleapis.com',
    required: false,
    tier: 'integration',
    description: 'Managed Jupyter notebooks',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GOOGLE WORKSPACE (9 APIs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'gmail',
    displayName: 'Gmail API',
    apiId: 'gmail.googleapis.com',
    required: true,
    tier: 'integration',
    description: 'Email automation and inbox management',
    useCases: ['Email copywriting', 'Inbox prioritizer', 'Auto-responders'],
  },
  {
    name: 'calendar',
    displayName: 'Google Calendar API',
    apiId: 'calendar-json.googleapis.com',
    required: true,
    tier: 'integration',
    description: 'Calendar management and scheduling',
    useCases: ['Appointment booking', 'Meeting schedulers', 'Reminder systems'],
  },
  {
    name: 'chat',
    displayName: 'Google Chat API',
    apiId: 'chat.googleapis.com',
    required: false,
    tier: 'integration',
    description: 'Chat messaging and bots',
    useCases: ['Team notifications', 'Workflow bots'],
  },
  {
    name: 'meet',
    displayName: 'Google Meet API',
    apiId: 'meet.googleapis.com',
    required: false,
    tier: 'integration',
    description: 'Video conferencing',
    useCases: ['Meeting scheduling', 'Recording management'],
  },
  {
    name: 'docs',
    displayName: 'Google Docs API',
    apiId: 'docs.googleapis.com',
    required: true,
    tier: 'integration',
    description: 'Document creation and editing',
    useCases: ['Report generation', 'Contract creation', 'Proposal automation'],
  },
  {
    name: 'sheets',
    displayName: 'Google Sheets API',
    apiId: 'sheets.googleapis.com',
    required: true,
    tier: 'integration',
    description: 'Spreadsheet data access',
    useCases: ['Report generation', 'Data import/export', 'Budget planners'],
  },
  {
    name: 'slides',
    displayName: 'Google Slides API',
    apiId: 'slides.googleapis.com',
    required: false,
    tier: 'integration',
    description: 'Presentation creation',
    useCases: ['Pitch deck generators', 'Report presentations'],
  },
  {
    name: 'drive',
    displayName: 'Google Drive API',
    apiId: 'drive.googleapis.com',
    required: true,
    tier: 'integration',
    description: 'File storage and document management',
    useCases: ['File attachments', 'Document collaboration', 'Backup systems'],
  },
  {
    name: 'forms',
    displayName: 'Google Forms API',
    apiId: 'forms.googleapis.com',
    required: false,
    tier: 'integration',
    description: 'Form creation and responses',
    useCases: ['Survey builders', 'Lead capture', 'Feedback collection'],
  },
  {
    name: 'admin',
    displayName: 'Admin SDK API',
    apiId: 'admin.googleapis.com',
    required: false,
    tier: 'integration',
    description: 'Workspace administration',
  },
  {
    name: 'groupssettings',
    displayName: 'Groups Settings API',
    apiId: 'groupssettings.googleapis.com',
    required: false,
    tier: 'integration',
    description: 'Google Groups management',
  },
  {
    name: 'script',
    displayName: 'Apps Script API',
    apiId: 'script.googleapis.com',
    required: false,
    tier: 'integration',
    description: 'Google Apps Script automation',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FIREBASE (10 APIs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'firebase',
    displayName: 'Firebase Management API',
    apiId: 'firebase.googleapis.com',
    required: true,
    tier: 'core',
    description: 'Firebase project management',
  },
  {
    name: 'firebasehosting',
    displayName: 'Firebase Hosting API',
    apiId: 'firebasehosting.googleapis.com',
    required: true,
    tier: 'core',
    description: 'Static hosting for web apps',
  },
  {
    name: 'fcm',
    displayName: 'Firebase Cloud Messaging API',
    apiId: 'fcm.googleapis.com',
    required: true,
    tier: 'integration',
    description: 'Push notifications',
    useCases: ['Mobile notifications', 'Web push', 'In-app messaging'],
  },
  {
    name: 'fcmregistrations',
    displayName: 'FCM Registration API',
    apiId: 'fcmregistrations.googleapis.com',
    required: true,
    tier: 'integration',
    description: 'FCM device registration',
  },
  {
    name: 'firebaseml',
    displayName: 'Firebase ML API',
    apiId: 'firebaseml.googleapis.com',
    required: false,
    tier: 'consciousness',
    description: 'On-device ML models',
  },
  {
    name: 'firebaseremoteconfig',
    displayName: 'Firebase Remote Config API',
    apiId: 'firebaseremoteconfig.googleapis.com',
    required: true,
    tier: 'core',
    description: 'Feature flags and A/B testing',
  },
  {
    name: 'firebaseremoteconfigrealtime',
    displayName: 'Firebase Remote Config Realtime API',
    apiId: 'firebaseremoteconfigrealtime.googleapis.com',
    required: false,
    tier: 'core',
    description: 'Real-time config updates',
  },
  {
    name: 'firebaserules',
    displayName: 'Firebase Rules API',
    apiId: 'firebaserules.googleapis.com',
    required: true,
    tier: 'security',
    description: 'Security rules management',
  },
  {
    name: 'firebaseinstallations',
    displayName: 'Firebase Installations API',
    apiId: 'firebaseinstallations.googleapis.com',
    required: false,
    tier: 'core',
    description: 'Installation ID management',
  },
  {
    name: 'firebasedynamiclinks',
    displayName: 'Firebase Dynamic Links API',
    apiId: 'firebasedynamiclinks.googleapis.com',
    required: false,
    tier: 'integration',
    description: 'Deep linking for apps',
  },
  {
    name: 'firebaseappdistribution',
    displayName: 'Firebase App Distribution API',
    apiId: 'firebaseappdistribution.googleapis.com',
    required: false,
    tier: 'core',
    description: 'Beta app distribution',
  },
  {
    name: 'testing',
    displayName: 'Cloud Testing API',
    apiId: 'testing.googleapis.com',
    required: false,
    tier: 'core',
    description: 'Mobile app testing',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAPS PLATFORM (12 APIs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'addressvalidation',
    displayName: 'Address Validation API',
    apiId: 'addressvalidation.googleapis.com',
    required: false,
    tier: 'optional',
    description: 'Address verification and standardization',
    useCases: ['E-commerce checkout', 'Delivery optimization', 'Form validation'],
  },
  {
    name: 'aerialview',
    displayName: 'Aerial View API',
    apiId: 'aerialview.googleapis.com',
    required: false,
    tier: 'optional',
    description: 'Aerial imagery for properties',
    useCases: ['Real estate', 'Property inspection', 'Solar assessment'],
  },
  {
    name: 'solar',
    displayName: 'Solar API',
    apiId: 'solar.googleapis.com',
    required: false,
    tier: 'optional',
    description: 'Solar potential analysis',
    useCases: ['Solar installation quotes', 'Renewable energy planning'],
  },
  {
    name: 'mapsbackend',
    displayName: 'Maps JavaScript API',
    apiId: 'maps-backend.googleapis.com',
    required: false,
    tier: 'optional',
    description: 'Interactive maps for web',
  },
  {
    name: 'mapsembed',
    displayName: 'Maps Embed API',
    apiId: 'maps-embed-backend.googleapis.com',
    required: false,
    tier: 'optional',
    description: 'Embedded maps',
  },
  {
    name: 'mapsplatformdatasets',
    displayName: 'Maps Platform Datasets API',
    apiId: 'mapsplatformdatasets.googleapis.com',
    required: false,
    tier: 'optional',
    description: 'Custom map datasets',
  },
  {
    name: 'places',
    displayName: 'Places API',
    apiId: 'places-backend.googleapis.com',
    required: false,
    tier: 'optional',
    description: 'Place search and details',
    useCases: ['Restaurant reservations', 'Local business search'],
  },
  {
    name: 'placesnew',
    displayName: 'Places API (New)',
    apiId: 'places.googleapis.com',
    required: false,
    tier: 'optional',
    description: 'Next-gen Places API',
  },
  {
    name: 'geocoding',
    displayName: 'Geocoding API',
    apiId: 'geocoding-backend.googleapis.com',
    required: false,
    tier: 'optional',
    description: 'Address to coordinates conversion',
  },
  {
    name: 'directions',
    displayName: 'Directions API',
    apiId: 'directions-backend.googleapis.com',
    required: false,
    tier: 'optional',
    description: 'Route planning',
    useCases: ['Delivery routing', 'Trip planning'],
  },
  {
    name: 'distancematrix',
    displayName: 'Distance Matrix API',
    apiId: 'distance-matrix-backend.googleapis.com',
    required: false,
    tier: 'optional',
    description: 'Travel time calculations',
  },
  {
    name: 'routes',
    displayName: 'Routes API',
    apiId: 'routes.googleapis.com',
    required: false,
    tier: 'optional',
    description: 'Advanced routing',
  },
  {
    name: 'streetview',
    displayName: 'Street View Static API',
    apiId: 'street-view-image-backend.googleapis.com',
    required: false,
    tier: 'optional',
    description: 'Street-level imagery',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SEARCH & DISCOVERY (3 APIs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'discoveryengine',
    displayName: 'Discovery Engine API',
    apiId: 'discoveryengine.googleapis.com',
    required: true,
    tier: 'consciousness',
    description: 'AI-powered search and recommendations',
    useCases: ['Site search', 'Product discovery', 'Content recommendations'],
  },
  {
    name: 'customsearch',
    displayName: 'Custom Search API',
    apiId: 'customsearch.googleapis.com',
    required: false,
    tier: 'consciousness',
    description: 'Custom search engine',
  },
  {
    name: 'kgsearch',
    displayName: 'Knowledge Graph Search API',
    apiId: 'kgsearch.googleapis.com',
    required: false,
    tier: 'consciousness',
    description: 'Knowledge graph entity search',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMMERCE (3 APIs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'retail',
    displayName: 'Vertex AI Search for Commerce API',
    apiId: 'retail.googleapis.com',
    required: true,
    tier: 'consciousness',
    description: 'E-commerce search and recommendations',
    useCases: ['Product recommendations', 'Search ranking', 'Personalization'],
  },
  {
    name: 'recommendationengine',
    displayName: 'Recommendations AI (Beta)',
    apiId: 'recommendationengine.googleapis.com',
    required: false,
    tier: 'consciousness',
    description: 'AI-powered recommendations',
  },
  {
    name: 'merchantapi',
    displayName: 'Merchant API',
    apiId: 'merchantapi.googleapis.com',
    required: false,
    tier: 'integration',
    description: 'Google Merchant Center integration',
    useCases: ['Product feeds', 'Shopping campaigns'],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MEDIA & CONTENT (3 APIs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'youtube',
    displayName: 'YouTube Data API v3',
    apiId: 'youtube.googleapis.com',
    required: true,
    tier: 'content',
    description: 'YouTube video and channel management',
    useCases: ['Script generators', 'Video analytics', 'Channel management'],
  },
  {
    name: 'photoslibrary',
    displayName: 'Photos Library API',
    apiId: 'photoslibrary.googleapis.com',
    required: false,
    tier: 'content',
    description: 'Google Photos integration',
    useCases: ['Photo backup', 'Album management'],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HEALTHCARE & SPECIALIZED (2 APIs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'healthcare',
    displayName: 'Cloud Healthcare API',
    apiId: 'healthcare.googleapis.com',
    required: false,
    tier: 'optional',
    description: 'HIPAA-compliant healthcare data',
    useCases: ['Medical records', 'FHIR data', 'Healthcare AI'],
  },
  {
    name: 'fitness',
    displayName: 'Fitness API',
    apiId: 'fitness.googleapis.com',
    required: false,
    tier: 'optional',
    description: 'Health and fitness data',
    useCases: ['Wellness apps', 'Activity tracking'],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // WORKFLOWS & AUTOMATION (2 APIs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'workflows',
    displayName: 'Workflows API',
    apiId: 'workflows.googleapis.com',
    required: true,
    tier: 'integration',
    description: 'Serverless workflow orchestration',
  },
  {
    name: 'workflowexecutions',
    displayName: 'Workflow Executions API',
    apiId: 'workflowexecutions.googleapis.com',
    required: true,
    tier: 'integration',
    description: 'Workflow execution management',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LEGACY/SOURCE CONTROL (1 API)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'source',
    displayName: 'Legacy Cloud Source Repositories API',
    apiId: 'source.googleapis.com',
    required: false,
    tier: 'core',
    description: 'Legacy source code repositories',
  },
];

/**
 * API count by tier
 */
export function getApiCountByTier(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const service of GCP_SERVICES) {
    counts[service.tier] = (counts[service.tier] || 0) + 1;
  }
  return counts;
}

/**
 * Get total API count
 */
export function getTotalApiCount(): number {
  return GCP_SERVICES.length;
}

/**
 * Get unique API IDs count (some services share APIs)
 */
export function getUniqueApiCount(): number {
  return new Set(GCP_SERVICES.map((s) => s.apiId)).size;
}

/**
 * Get services by tier
 */
export function getServicesByTier(tier: GCPServiceConfig['tier']): GCPServiceConfig[] {
  return GCP_SERVICES.filter((service) => service.tier === tier);
}

/**
 * Get required services only
 */
export function getRequiredServices(): GCPServiceConfig[] {
  return GCP_SERVICES.filter((service) => service.required);
}

/**
 * Get all API IDs for activation (deduplicated)
 */
export function getAllApiIds(): string[] {
  const uniqueApis = new Set(GCP_SERVICES.map((service) => service.apiId));
  return Array.from(uniqueApis);
}

/**
 * Get required API IDs for activation
 */
export function getRequiredApiIds(): string[] {
  const uniqueApis = new Set(getRequiredServices().map((service) => service.apiId));
  return Array.from(uniqueApis);
}

/**
 * Get services by use case keyword
 */
export function getServicesByUseCase(keyword: string): GCPServiceConfig[] {
  const lowerKeyword = keyword.toLowerCase();
  return GCP_SERVICES.filter((service) =>
    service.useCases?.some((uc) => uc.toLowerCase().includes(lowerKeyword)) ||
    service.description.toLowerCase().includes(lowerKeyword)
  );
}

/**
 * Service activation status tracking
 */
export interface ServiceActivationStatus {
  apiId: string;
  displayName: string;
  activated: boolean;
  activatedAt?: Date;
  error?: string;
}

/**
 * GCP Connection Status
 */
export interface GCPConnectionStatus {
  connected: boolean;
  projectId: string;
  projectNumber: string;
  authenticatedAs?: string;
  servicesActivated: number;
  totalServices: number;
  lastCheck: Date;
}
