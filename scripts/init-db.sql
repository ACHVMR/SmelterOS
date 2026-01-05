-- SmelterOS Database Initialization Script
-- Run automatically by docker-compose on first startup

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table first (no dependencies)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  owner_id UUID, -- Will be updated after users table exists
  plan VARCHAR(50) NOT NULL DEFAULT 'starter',
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ,
  
  CONSTRAINT valid_plan CHECK (plan IN ('starter', 'professional', 'enterprise', 'custom'))
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  
  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'developer', 'viewer'))
);

-- Now add foreign key to organizations
ALTER TABLE organizations 
  ADD CONSTRAINT fk_owner 
  FOREIGN KEY (owner_id) REFERENCES users(id);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  repository_url VARCHAR(500),
  environment VARCHAR(50) NOT NULL DEFAULT 'development',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_environment CHECK (environment IN ('development', 'staging', 'production')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'archived'))
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID NOT NULL REFERENCES users(id),
  conversation_id UUID,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority VARCHAR(50) NOT NULL DEFAULT 'normal',
  assigned_specialist VARCHAR(100),
  execution_time_ms INTEGER,
  tokens_used INTEGER,
  fdh_cycles INTEGER,
  success BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT valid_type CHECK (type IN ('code', 'review', 'deploy', 'debug', 'document', 'test')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'queued', 'in_progress', 'completed', 'failed', 'cancelled')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Create circuit metrics table (partitioned)
CREATE TABLE IF NOT EXISTS circuit_metrics (
  id UUID DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  panel_id VARCHAR(100) NOT NULL,
  circuit_id VARCHAR(100) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  latency_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_type VARCHAR(100),
  
  PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create initial partition for current month
CREATE TABLE IF NOT EXISTS circuit_metrics_default PARTITION OF circuit_metrics DEFAULT;

-- Create API requests table (partitioned)
CREATE TABLE IF NOT EXISTS api_requests (
  id UUID DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  user_id UUID,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

CREATE TABLE IF NOT EXISTS api_requests_default PARTITION OF api_requests DEFAULT;

-- Create usage daily aggregates table
CREATE TABLE IF NOT EXISTS usage_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  date DATE NOT NULL,
  api_calls INTEGER NOT NULL DEFAULT 0,
  tokens_used BIGINT NOT NULL DEFAULT 0,
  tasks_executed INTEGER NOT NULL DEFAULT 0,
  storage_bytes BIGINT NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  circuit_trips INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms DECIMAL(10,2),
  p95_latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_org_date UNIQUE (organization_id, date)
);

-- Create embeddings table with vector support
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  source_type VARCHAR(50) NOT NULL,
  source_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_source CHECK (source_type IN ('file', 'conversation', 'documentation'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active, last_active_at);
CREATE INDEX IF NOT EXISTS idx_orgs_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_orgs_stripe ON organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_daily_org ON usage_daily(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_embeddings_project ON embeddings(project_id);

-- HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Insert seed data for development
INSERT INTO organizations (id, name, slug, plan) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Development Org', 'dev-org', 'enterprise')
ON CONFLICT (slug) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO smelter;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO smelter;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'SmelterOS database initialized successfully!';
END $$;
