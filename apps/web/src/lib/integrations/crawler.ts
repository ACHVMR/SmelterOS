/**
 * Crawler/Scraper Factory
 * Unified interface for multiple crawling services
 * Supports: Firecrawl, Apify, Tavily, Serper
 */

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface CrawlResult {
  url: string;
  content: string;
  markdown?: string;
  html?: string;
  metadata?: Record<string, unknown>;
}

interface CrawlerConfig {
  provider: 'firecrawl' | 'apify' | 'tavily' | 'serper';
  options?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════
// FIRECRAWL
// ═══════════════════════════════════════════════════════════════════════

async function crawlWithFirecrawl(url: string): Promise<CrawlResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY not set');

  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error(`Firecrawl error: ${response.status}`);
  }

  const data = await response.json();
  return {
    url,
    content: data.data?.content || '',
    markdown: data.data?.markdown,
    html: data.data?.html,
    metadata: data.data?.metadata,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// APIFY
// ═══════════════════════════════════════════════════════════════════════

async function crawlWithApify(url: string, actorId = 'apify/web-scraper'): Promise<CrawlResult> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) throw new Error('APIFY_API_TOKEN not set');

  const response = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startUrls: [{ url }],
        maxPagesPerCrawl: 1,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Apify error: ${response.status}`);
  }

  const run = await response.json();
  
  // Poll for completion
  let status = run.data.status;
  while (status === 'RUNNING' || status === 'READY') {
    await new Promise(r => setTimeout(r, 2000));
    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${run.data.id}?token=${apiToken}`
    );
    const statusData = await statusRes.json();
    status = statusData.data.status;
  }

  // Get results
  const resultsRes = await fetch(
    `https://api.apify.com/v2/datasets/${run.data.defaultDatasetId}/items?token=${apiToken}`
  );
  const results = await resultsRes.json();

  return {
    url,
    content: results[0]?.text || '',
    html: results[0]?.html,
    metadata: results[0],
  };
}

// ═══════════════════════════════════════════════════════════════════════
// TAVILY
// ═══════════════════════════════════════════════════════════════════════

async function searchWithTavily(query: string): Promise<CrawlResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error('TAVILY_API_KEY not set');

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'advanced',
      include_raw_content: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily error: ${response.status}`);
  }

  const data = await response.json();
  return data.results.map((r: { url: string; content: string; raw_content?: string }) => ({
    url: r.url,
    content: r.content,
    html: r.raw_content,
  }));
}

// ═══════════════════════════════════════════════════════════════════════
// SERPER
// ═══════════════════════════════════════════════════════════════════════

async function searchWithSerper(query: string): Promise<CrawlResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error('SERPER_API_KEY not set');

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({ q: query }),
  });

  if (!response.ok) {
    throw new Error(`Serper error: ${response.status}`);
  }

  const data = await response.json();
  return data.organic.map((r: { link: string; snippet: string; title: string }) => ({
    url: r.link,
    content: r.snippet,
    metadata: { title: r.title },
  }));
}

// ═══════════════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════════════

export async function crawl(url: string, config?: CrawlerConfig): Promise<CrawlResult> {
  const provider = config?.provider || 'firecrawl';

  switch (provider) {
    case 'firecrawl':
      return crawlWithFirecrawl(url);
    case 'apify':
      return crawlWithApify(url);
    default:
      throw new Error(`Unsupported crawler provider: ${provider}`);
  }
}

export async function search(query: string, provider: 'tavily' | 'serper' = 'tavily'): Promise<CrawlResult[]> {
  switch (provider) {
    case 'tavily':
      return searchWithTavily(query);
    case 'serper':
      return searchWithSerper(query);
    default:
      throw new Error(`Unsupported search provider: ${provider}`);
  }
}

export const CrawlerClient = {
  crawl,
  search,
  crawlWithFirecrawl,
  crawlWithApify,
  searchWithTavily,
  searchWithSerper,
};

export default CrawlerClient;
