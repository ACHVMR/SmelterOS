---
name: smelteros-mcp-management
description: Model Context Protocol (MCP) management and integration skill. Covers ACP, UCP, Sanity MCP, Composio, World Labs API, Crawlers (Firecrawl, Apify, Tavily, Serper), and Sandboxes (E2B, CodeSandbox). Use this when working with AI agent protocols and external service integrations.
---

# SmelterOS MCP & Integration Management

Comprehensive guide for managing Model Context Protocol (MCP) servers, crawlers, sandboxes, and related agentic communication protocols within the SmelterOS ecosystem.

---

## 🔑 Environment Setup (NO HARDCODING)

All API keys and secrets are stored in `.env.local`. See `.env.example` for the full template.

```bash
# Copy the template
cp .env.example .env.local

# Edit with your keys
code .env.local
```

**Key Categories:**
- **AI Providers:** OpenRouter, OpenAI, Anthropic, Google AI
- **World Labs:** 3D world generation API
- **MCP Crawlers:** Firecrawl, Apify, Tavily, Serper
- **Sandboxes:** E2B, CodeSandbox
- **CMS:** Sanity
- **Unified MCP:** Composio

---

### Model Context Protocol (MCP)

The **Model Context Protocol** is an open standard for connecting AI assistants to external data sources, tools, and services. It provides a unified way for AI agents to:
- Access files and databases
- Execute tools and commands
- Integrate with third-party services
- Maintain context across sessions

### Related Protocols

| Protocol | Full Name | Purpose |
|----------|-----------|---------|
| **MCP** | Model Context Protocol | Core protocol for AI-to-service communication |
| **ACP** | Agentic Communication Protocol / Agent Client Protocol | Agent-to-agent and agent-to-client messaging |
| **UCP** | Universal Communication Protocol | Cross-platform, protocol-agnostic integration layer |

---

## 🔌 Protocol Activation

### ACP (Agentic Communication Protocol)

ACP enables structured communication between AI agents and clients.

**Configuration:**
```json
{
  "acp": {
    "version": "1.0",
    "mode": "bidirectional",
    "channels": {
      "agent-to-agent": true,
      "agent-to-client": true,
      "broadcast": false
    },
    "authentication": {
      "type": "bearer",
      "tokenEndpoint": "/auth/acp/token"
    },
    "messageFormat": "json",
    "compression": "gzip"
  }
}
```

**Activation Steps:**
1. Configure ACP endpoint in environment
2. Set up authentication tokens
3. Register agent capabilities
4. Establish communication channels

**Environment Variables:**
```env
ACP_ENABLED=true
ACP_ENDPOINT=wss://your-domain.com/acp
ACP_AUTH_TOKEN=your-acp-token
ACP_AGENT_ID=smelteros-agent-001
```

---

### UCP (Universal Communication Protocol)

UCP provides a unified abstraction layer across different protocols.

**Configuration:**
```json
{
  "ucp": {
    "version": "1.0",
    "adapters": [
      "mcp",
      "acp",
      "rest",
      "graphql",
      "grpc"
    ],
    "routing": {
      "strategy": "round-robin",
      "fallback": true,
      "retryPolicy": {
        "maxRetries": 3,
        "backoffMs": 1000
      }
    },
    "transforms": {
      "input": ["normalize", "validate"],
      "output": ["format", "compress"]
    }
  }
}
```

**Activation Steps:**
1. Install UCP adapter package
2. Configure protocol adapters
3. Set up routing rules
4. Enable protocol bridging

**Environment Variables:**
```env
UCP_ENABLED=true
UCP_PRIMARY_PROTOCOL=mcp
UCP_FALLBACK_PROTOCOLS=acp,rest
UCP_TRANSFORM_ENABLED=true
```

---

## 📦 MCP Server Integrations

### Sanity MCP Server

**Purpose:** Headless CMS integration for content management, structured data, and GROQ queries.

**What Sanity MCP Provides:**
- Real-time content fetching via GROQ
- Asset management (images, files)
- Schema introspection
- Document CRUD operations
- Webhook event handling

**Configuration:**
```json
{
  "mcpServers": {
    "sanity": {
      "command": "npx",
      "args": ["-y", "@sanity/mcp-server"],
      "env": {
        "SANITY_PROJECT_ID": "your-project-id",
        "SANITY_DATASET": "production",
        "SANITY_API_TOKEN": "your-api-token",
        "SANITY_API_VERSION": "2024-01-01"
      }
    }
  }
}
```

**Available Tools:**
| Tool | Description |
|------|-------------|
| `sanity_query` | Execute GROQ queries |
| `sanity_create` | Create new documents |
| `sanity_update` | Update existing documents |
| `sanity_delete` | Delete documents |
| `sanity_assets` | Manage media assets |
| `sanity_schema` | Introspect content schemas |

**Example GROQ Queries:**
```groq
// Get all blog posts
*[_type == "post"]{title, slug, publishedAt}

// Get post with references
*[_type == "post" && slug.current == "my-post"][0]{
  title,
  body,
  "author": author->{name, image}
}
```

---

### Composio Unified MCP Integration Manager

**Purpose:** Centralized management of multiple MCP servers and tool integrations.

**What Composio Provides:**
- Unified tool registry across MCP servers
- Authentication management for 100+ integrations
- Rate limiting and quota management
- Usage analytics and monitoring
- Pre-built integrations (GitHub, Slack, Notion, etc.)

**Configuration:**
```json
{
  "mcpServers": {
    "composio": {
      "command": "npx",
      "args": ["-y", "composio-mcp"],
      "env": {
        "COMPOSIO_API_KEY": "your-composio-api-key"
      }
    }
  }
}
```

**Pre-Built Integrations:**
| Category | Services |
|----------|----------|
| **Development** | GitHub, GitLab, Jira, Linear, Notion |
| **Communication** | Slack, Discord, Email, Teams |
| **Productivity** | Google Workspace, Airtable, Trello |
| **Data** | PostgreSQL, MongoDB, Supabase |
| **AI/ML** | OpenAI, Anthropic, Hugging Face |
| **Storage** | AWS S3, Google Cloud, Dropbox |

**Activation via Composio:**
```typescript
import { ComposioToolSet } from "composio-core";

const toolset = new ComposioToolSet({
  apiKey: process.env.COMPOSIO_API_KEY
});

// Get available tools
const tools = await toolset.getTools({
  apps: ["github", "slack", "notion"]
});
```

---

## 🛠️ MCP Server Setup

### Adding a New MCP Server

**Step 1: Install the MCP server package**
```powershell
npm install -g @modelcontextprotocol/server-name
# or
npx -y @modelcontextprotocol/server-name
```

**Step 2: Configure in your MCP settings**

For VS Code / Cursor / Windsurf:
```json
// .vscode/mcp.json or equivalent
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@scope/server-name"],
      "env": {
        "API_KEY": "${env:SERVER_API_KEY}"
      }
    }
  }
}
```

**Step 3: Verify connection**
- Restart your IDE/agent
- Check server logs for connection status
- Test a simple tool call

---

### Common MCP Servers

| Server | Package | Purpose |
|--------|---------|---------|
| **Filesystem** | `@modelcontextprotocol/server-filesystem` | Local file operations |
| **GitHub** | `@modelcontextprotocol/server-github` | GitHub API access |
| **PostgreSQL** | `@modelcontextprotocol/server-postgres` | Database queries |
| **Puppeteer** | `@modelcontextprotocol/server-puppeteer` | Browser automation |
| **Brave Search** | `@modelcontextprotocol/server-brave-search` | Web search |
| **Memory** | `@modelcontextprotocol/server-memory` | Persistent memory |
| **Sanity** | `@sanity/mcp-server` | CMS integration |
| **Composio** | `composio-mcp` | Unified integrations |

---

## 📁 SmelterOS MCP Configuration

### Recommended Configuration File

Create `.mcp/config.json` in the project root:

```json
{
  "version": "1.0",
  "protocols": {
    "mcp": {
      "enabled": true,
      "servers": {
        "filesystem": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"]
        },
        "sanity": {
          "command": "npx",
          "args": ["-y", "@sanity/mcp-server"],
          "env": {
            "SANITY_PROJECT_ID": "${env:SANITY_PROJECT_ID}",
            "SANITY_DATASET": "production",
            "SANITY_API_TOKEN": "${env:SANITY_API_TOKEN}"
          }
        },
        "composio": {
          "command": "npx",
          "args": ["-y", "composio-mcp"],
          "env": {
            "COMPOSIO_API_KEY": "${env:COMPOSIO_API_KEY}"
          }
        }
      }
    },
    "acp": {
      "enabled": true,
      "endpoint": "${env:ACP_ENDPOINT}",
      "agentId": "smelteros-foundry"
    },
    "ucp": {
      "enabled": true,
      "adapters": ["mcp", "acp", "rest"]
    }
  }
}
```

### Environment Variables Template

Add to `.env.local`:

```env
# Sanity CMS
SANITY_PROJECT_ID=your-project-id
SANITY_DATASET=production
SANITY_API_TOKEN=your-sanity-token

# Composio
COMPOSIO_API_KEY=your-composio-api-key

# ACP
ACP_ENABLED=true
ACP_ENDPOINT=wss://api.smelteros.com/acp
ACP_AGENT_ID=foundry-agent-001

# UCP
UCP_ENABLED=true
UCP_PRIMARY_PROTOCOL=mcp
```

---

## 🔄 Protocol Bridging

### MCP ↔ ACP Bridge

Enable agents using MCP to communicate with ACP-based systems:

```typescript
// bridge/mcp-acp.ts
interface ProtocolBridge {
  source: "mcp" | "acp";
  target: "mcp" | "acp";
  transform: (message: unknown) => unknown;
}

const mcpToAcp: ProtocolBridge = {
  source: "mcp",
  target: "acp",
  transform: (mcpMessage) => ({
    type: "acp_request",
    payload: mcpMessage,
    metadata: {
      sourceProtocol: "mcp",
      timestamp: Date.now()
    }
  })
};
```

### UCP Universal Adapter

```typescript
// adapters/ucp-adapter.ts
interface UCPAdapter {
  protocol: string;
  connect: () => Promise<void>;
  send: (message: unknown) => Promise<unknown>;
  receive: () => AsyncGenerator<unknown>;
}

const createUCPAdapter = (protocol: string): UCPAdapter => {
  // Implementation based on protocol type
};
```

---

## 🧪 Testing MCP Connections

### Health Check Script

```powershell
# Test MCP server connectivity
npx @modelcontextprotocol/inspector

# Test specific server
npx mcp-test --server sanity --timeout 5000
```

### Manual Testing

```typescript
// test/mcp-health.ts
async function testMCPServers() {
  const servers = ["filesystem", "sanity", "composio"];
  
  for (const server of servers) {
    try {
      const result = await mcpClient.ping(server);
      console.log(`✅ ${server}: ${result.latency}ms`);
    } catch (error) {
      console.log(`❌ ${server}: ${error.message}`);
    }
  }
}
```

---

## 📊 Monitoring & Debugging

### Logging Configuration

```json
{
  "logging": {
    "mcp": {
      "level": "debug",
      "includePayloads": true,
      "destination": "logs/mcp.log"
    },
    "acp": {
      "level": "info",
      "destination": "logs/acp.log"
    }
  }
}
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Server not connecting | Check environment variables and network |
| Authentication failed | Verify API keys and tokens |
| Timeout errors | Increase timeout, check server health |
| Tool not found | Verify server is running, check tool name |

---

## 🎯 When to Use This Skill

1. **Setting up new MCP servers** — Follow server setup steps
2. **Integrating external services** — Use Composio or direct MCP
3. **Configuring agent protocols** — Reference ACP/UCP activation
4. **Content management** — Use Sanity MCP integration
5. **Debugging connections** — Use testing and monitoring sections
6. **Protocol bridging** — Reference bridging patterns
7. **Web crawling/scraping** — Use Firecrawl, Apify, Tavily, or Serper clients
8. **3D world generation** — Use World Labs API client
9. **AI code execution** — Use E2B or CodeSandbox sandboxes

---

## 🌍 World Labs API (3D World Generation)

Generate immersive 3D worlds from text, images, or video.

**Client Location:** `apps/web/src/lib/integrations/world-labs.ts`

**Usage:**
```typescript
import { generateWorldAndWait } from '@/lib/integrations';

const world = await generateWorldAndWait({
  display_name: "Mystical Foundry",
  world_prompt: {
    type: 'text',
    text_prompt: 'An industrial smelting foundry with molten metal rivers'
  },
  model: 'Marble 0.1-plus' // or 'Marble 0.1-mini' for faster/cheaper
});

console.log(world.world_marble_url); // View in browser
console.log(world.assets.splats.spz_urls.full_res); // 3D Gaussian splat
```

---

## 🕷️ Crawler/Scraper Clients

Unified interface for web crawling and search.

**Client Location:** `apps/web/src/lib/integrations/crawler.ts`

| Provider | Best For | API Key Env Var |
|----------|----------|-----------------|
| **Firecrawl** | Clean Markdown extraction | `FIRECRAWL_API_KEY` |
| **Apify** | Complex scraping with Actors | `APIFY_API_TOKEN` |
| **Tavily** | AI-powered search + extract | `TAVILY_API_KEY` |
| **Serper** | Google search results | `SERPER_API_KEY` |

**Usage:**
```typescript
import { crawl, search } from '@/lib/integrations';

// Crawl a single page
const page = await crawl('https://example.com', { provider: 'firecrawl' });
console.log(page.markdown);

// Search the web
const results = await search('SmelterOS AI platform', 'tavily');
results.forEach(r => console.log(r.url, r.content));
```

---

## 🧪 Sandbox Clients (AI Code Execution)

Secure sandboxes for executing AI-generated code.

**Client Location:** `apps/web/src/lib/integrations/sandbox.ts`

| Provider | Best For | API Key Env Var |
|----------|----------|-----------------|
| **E2B** | Python/Node execution | `E2B_API_KEY` |
| **CodeSandbox** | Full web projects | `CODESANDBOX_API_KEY` |

**Usage:**
```typescript
import { createSandbox, stopSandbox } from '@/lib/integrations';

// Execute Python code
const result = await createSandbox(`
print("Hello from SmelterOS!")
result = 2 + 2
print(f"Result: {result}")
`, { provider: 'e2b', template: 'python' });

console.log(result.output);

// Clean up
await stopSandbox(result.id, 'e2b');
```

---

## 📚 Resources

**MCP & Protocols:**
- [MCP Specification](https://modelcontextprotocol.io)
- [MCP Server Registry](https://github.com/modelcontextprotocol/servers)
- [Composio Documentation](https://docs.composio.dev)
- [Sanity Developer Docs](https://www.sanity.io/docs)

**Crawlers & Search:**
- [Firecrawl Docs](https://docs.firecrawl.dev)
- [Apify Docs](https://docs.apify.com)
- [Tavily Docs](https://docs.tavily.com)
- [Serper Docs](https://serper.dev/docs)

**3D World Generation:**
- [World Labs Platform](https://platform.worldlabs.ai)
- [World Labs API Docs](https://docs.worldlabs.ai)
- [World Labs llms.txt](https://docs.worldlabs.ai/llms.txt)

**Sandboxes:**
- [E2B Documentation](https://e2b.dev/docs)
- [CodeSandbox SDK](https://codesandbox.io/docs/sdk)

