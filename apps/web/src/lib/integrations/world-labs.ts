/**
 * World Labs API Client
 * 3D World Generation from text, images, or video
 * https://docs.worldlabs.ai
 */

const WORLD_LABS_API_URL = process.env.WORLD_LABS_API_URL || 'https://api.worldlabs.ai/marble/v1';
const WORLD_LABS_API_KEY = process.env.WORLD_LABS_API_KEY;

interface WorldPromptText {
  type: 'text';
  text_prompt: string;
}

interface WorldPromptImage {
  type: 'image';
  image_prompt: {
    source: 'uri' | 'media_asset';
    uri?: string;
    media_asset_id?: string;
    is_pano?: boolean;
  };
  text_prompt?: string;
}

interface WorldPromptVideo {
  type: 'video';
  video_prompt: {
    source: 'uri' | 'media_asset';
    uri?: string;
    media_asset_id?: string;
  };
  text_prompt?: string;
}

type WorldPrompt = WorldPromptText | WorldPromptImage | WorldPromptVideo;

interface GenerateWorldRequest {
  display_name: string;
  world_prompt: WorldPrompt;
  model?: 'Marble 0.1-plus' | 'Marble 0.1-mini';
}

interface WorldAssets {
  caption: string;
  thumbnail_url: string;
  splats: {
    spz_urls: {
      '100k': string;
      '500k': string;
      full_res: string;
    };
  };
  mesh: {
    collider_mesh_url: string;
  };
  imagery: {
    pano_url: string;
  };
}

interface World {
  id: string;
  display_name: string;
  world_marble_url: string;
  assets: WorldAssets;
  created_at: string;
  updated_at: string;
  world_prompt: WorldPrompt | null;
  model: string | null;
}

interface Operation {
  operation_id: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  done: boolean;
  error: { code: string; message: string } | null;
  metadata: {
    progress: { status: string; description: string };
    world_id: string;
  } | null;
  response: World | null;
}

async function worldLabsRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!WORLD_LABS_API_KEY) {
    throw new Error('WORLD_LABS_API_KEY is not set in environment variables');
  }

  const response = await fetch(`${WORLD_LABS_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'WLT-Api-Key': WORLD_LABS_API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`World Labs API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Generate a new 3D world from a prompt
 */
export async function generateWorld(request: GenerateWorldRequest): Promise<Operation> {
  return worldLabsRequest<Operation>('/worlds:generate', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Poll an operation until it's complete
 */
export async function getOperation(operationId: string): Promise<Operation> {
  return worldLabsRequest<Operation>(`/operations/${operationId}`);
}

/**
 * Get a world by ID
 */
export async function getWorld(worldId: string): Promise<{ world: World }> {
  return worldLabsRequest<{ world: World }>(`/worlds/${worldId}`);
}

/**
 * Generate a world and wait for completion
 */
export async function generateWorldAndWait(
  request: GenerateWorldRequest,
  pollIntervalMs = 10000,
  maxWaitMs = 600000
): Promise<World> {
  const operation = await generateWorld(request);
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const status = await getOperation(operation.operation_id);
    
    if (status.done) {
      if (status.error) {
        throw new Error(`World generation failed: ${status.error.message}`);
      }
      if (status.response) {
        return status.response;
      }
      throw new Error('Operation completed but no response received');
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error('World generation timed out');
}

/**
 * Prepare a media asset upload
 */
export async function prepareMediaUpload(
  fileName: string,
  kind: 'image' | 'video',
  extension: string
): Promise<{
  media_asset: { id: string };
  upload_info: { upload_url: string; upload_method: string; required_headers: Record<string, string> };
}> {
  return worldLabsRequest('/media-assets:prepare_upload', {
    method: 'POST',
    body: JSON.stringify({ file_name: fileName, kind, extension }),
  });
}

export const WorldLabsClient = {
  generateWorld,
  generateWorldAndWait,
  getOperation,
  getWorld,
  prepareMediaUpload,
};

export default WorldLabsClient;
