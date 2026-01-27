/**
 * World Labs API Test Script
 * Run with: npx tsx scripts/test-world-labs.ts
 */

const WORLD_LABS_API_KEY = process.env.WORLD_LABS_API_KEY;
const WORLD_LABS_API_URL = 'https://api.worldlabs.ai/marble/v1';

async function testWorldLabsAPI() {
  console.log('🌍 Testing World Labs API...\n');

  if (!WORLD_LABS_API_KEY) {
    console.error('❌ WORLD_LABS_API_KEY not set in environment');
    console.log('   Run: $env:WORLD_LABS_API_KEY="your-key"');
    process.exit(1);
  }

  console.log('✅ API Key found');
  console.log('📡 Sending world generation request...\n');

  try {
    // Generate a world
    const response = await fetch(`${WORLD_LABS_API_URL}/worlds:generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'WLT-Api-Key': WORLD_LABS_API_KEY,
      },
      body: JSON.stringify({
        display_name: 'SmelterOS Foundry Test',
        world_prompt: {
          type: 'text',
          text_prompt: 'An industrial smelting foundry with molten orange metal flowing through channels, dark atmospheric lighting with glowing sparks, cinematic'
        },
        model: 'Marble 0.1-mini' // Using mini for faster test (~30-45s)
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error ${response.status}: ${error}`);
    }

    const operation = await response.json();
    console.log('✅ World generation started!');
    console.log(`   Operation ID: ${operation.operation_id}`);
    console.log(`   World ID: ${operation.metadata?.world_id || 'pending'}`);
    console.log('\n⏳ Polling for completion (this takes 30-45 seconds for mini, 5 min for plus)...\n');

    // Poll for completion
    let done = false;
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes max

    while (!done && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 10000)); // Wait 10 seconds
      attempts++;

      const statusResponse = await fetch(`${WORLD_LABS_API_URL}/operations/${operation.operation_id}`, {
        headers: { 'WLT-Api-Key': WORLD_LABS_API_KEY },
      });

      const status = await statusResponse.json();
      
      if (status.done) {
        done = true;
        if (status.error) {
          console.error('❌ Generation failed:', status.error.message);
        } else if (status.response) {
          console.log('🎉 World generated successfully!\n');
          console.log('═══════════════════════════════════════════════════════');
          console.log(`   Name: ${status.response.display_name}`);
          console.log(`   View: ${status.response.world_marble_url}`);
          console.log(`   Caption: ${status.response.assets?.caption?.slice(0, 100)}...`);
          console.log('═══════════════════════════════════════════════════════\n');
          
          console.log('📦 Assets:');
          console.log(`   Thumbnail: ${status.response.assets?.thumbnail_url}`);
          console.log(`   Panorama: ${status.response.assets?.imagery?.pano_url}`);
          console.log(`   3D Splat (100k): ${status.response.assets?.splats?.spz_urls?.['100k']}`);
        }
      } else {
        const progress = status.metadata?.progress?.description || 'Processing...';
        console.log(`   [${attempts * 10}s] ${progress}`);
      }
    }

    if (!done) {
      console.log('⚠️ Timed out waiting for generation. Check the operation later:');
      console.log(`   Operation ID: ${operation.operation_id}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testWorldLabsAPI();
