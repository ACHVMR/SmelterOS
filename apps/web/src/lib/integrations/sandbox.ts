/**
 * Sandbox Factory
 * Unified interface for cloud sandbox providers
 * Supports: CodeSandbox SDK, E2B
 */

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface SandboxResult {
  id: string;
  url?: string;
  status: 'running' | 'stopped' | 'error';
  output?: string;
}

interface SandboxConfig {
  provider: 'codesandbox' | 'e2b';
  template?: string;
  timeout?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// E2B
// ═══════════════════════════════════════════════════════════════════════

async function createE2BSandbox(code: string, language = 'python'): Promise<SandboxResult> {
  const apiKey = process.env.E2B_API_KEY;
  if (!apiKey) throw new Error('E2B_API_KEY not set');

  const response = await fetch('https://api.e2b.dev/sandboxes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      template: language === 'python' ? 'Python3' : 'Nodejs',
    }),
  });

  if (!response.ok) {
    throw new Error(`E2B error: ${response.status}`);
  }

  const sandbox = await response.json();

  // Execute code
  const execResponse = await fetch(`https://api.e2b.dev/sandboxes/${sandbox.id}/code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({ code }),
  });

  const result = await execResponse.json();

  return {
    id: sandbox.id,
    status: 'running',
    output: result.stdout || result.stderr,
  };
}

async function stopE2BSandbox(sandboxId: string): Promise<void> {
  const apiKey = process.env.E2B_API_KEY;
  if (!apiKey) throw new Error('E2B_API_KEY not set');

  await fetch(`https://api.e2b.dev/sandboxes/${sandboxId}`, {
    method: 'DELETE',
    headers: { 'X-API-Key': apiKey },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// CODESANDBOX
// ═══════════════════════════════════════════════════════════════════════

async function createCodeSandbox(files: Record<string, string>): Promise<SandboxResult> {
  const apiKey = process.env.CODESANDBOX_API_KEY;
  if (!apiKey) throw new Error('CODESANDBOX_API_KEY not set');

  const response = await fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      files: Object.entries(files).reduce((acc, [path, content]) => ({
        ...acc,
        [path]: { content },
      }), {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`CodeSandbox error: ${response.status}`);
  }

  const data = await response.json();

  return {
    id: data.sandbox_id,
    url: `https://codesandbox.io/s/${data.sandbox_id}`,
    status: 'running',
  };
}

// ═══════════════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════════════

export async function createSandbox(
  code: string | Record<string, string>,
  config?: SandboxConfig
): Promise<SandboxResult> {
  const provider = config?.provider || 'e2b';

  switch (provider) {
    case 'e2b':
      if (typeof code !== 'string') {
        throw new Error('E2B requires a single code string');
      }
      return createE2BSandbox(code, config?.template);
    case 'codesandbox':
      if (typeof code === 'string') {
        return createCodeSandbox({ 'index.js': code });
      }
      return createCodeSandbox(code);
    default:
      throw new Error(`Unsupported sandbox provider: ${provider}`);
  }
}

export async function stopSandbox(sandboxId: string, provider: 'e2b' | 'codesandbox' = 'e2b'): Promise<void> {
  switch (provider) {
    case 'e2b':
      return stopE2BSandbox(sandboxId);
    default:
      throw new Error(`Stop not supported for provider: ${provider}`);
  }
}

export const SandboxClient = {
  createSandbox,
  stopSandbox,
  createE2BSandbox,
  stopE2BSandbox,
  createCodeSandbox,
};

export default SandboxClient;
