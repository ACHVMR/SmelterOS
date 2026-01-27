---
name: smelteros-remotion
description: Remotion video generation and media creation skill for SmelterOS. Use this when creating programmatic videos, animations, and media assets.
---

# SmelterOS Remotion Media Forge

This skill covers the Remotion integration for programmatic video generation in SmelterOS.

## Overview

Remotion is a React-based video creation framework that allows you to create videos using code. SmelterOS uses Remotion for:
- Intro/outro videos
- Marketing content
- Animated demos
- AI-generated media compilation

## Project Location

```
apps/media-forge/
├── src/
│   ├── Root.tsx           # Composition registry
│   ├── SmelterOSIntro.tsx # Main intro video
│   └── HelloWorld/        # Template components
├── public/
│   └── assets/
│       └── world-labs/    # 3D world assets from World Labs API
├── package.json
└── remotion.config.ts
```

## Quick Commands

```bash
# Navigate to Remotion project
cd apps/media-forge

# Start Remotion Studio (preview/edit)
npm run dev

# Render a video to MP4
npx remotion render SmelterOSIntro out/smelter-intro.mp4

# Render with custom settings
npx remotion render SmelterOSIntro out/video.mp4 --codec=h264 --quality=80

# Build for production
npm run build
```

## Available Compositions

| ID | Description | Duration | Resolution |
|----|-------------|----------|------------|
| `SmelterOSIntro` | Main intro with molten forge aesthetic | 5s (150 frames @ 30fps) | 1920x1080 |
| `HelloWorld` | Default Remotion template | 5s | 1920x1080 |
| `OnlyLogo` | Logo-only animation | 5s | 1920x1080 |

## Creating New Compositions

### 1. Create the Component

```tsx
// src/MyComposition.tsx
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Animation using spring
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  
  // Linear interpolation
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0A0A" }}>
      <h1 style={{ 
        fontSize: 80, 
        color: "white",
        transform: `scale(${scale})`,
        opacity 
      }}>
        Hello SmelterOS
      </h1>
    </AbsoluteFill>
  );
};
```

### 2. Register in Root.tsx

```tsx
import { Composition } from "remotion";
import { MyComposition } from "./MyComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComposition"
        component={MyComposition}
        durationInFrames={150}  // 5 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
```

## SmelterOS Design Tokens (for videos)

Match the SmelterOS visual identity in videos:

```tsx
// Colors
const colors = {
  foundry900: "#0A0A0A",
  foundry800: "#181311",
  moltenCore: "#FF4D00",
  moltenHighlight: "#FFB700",
  systemTeal: "#00C2B2",
  systemGreen: "#22C55E",
};

// Fonts (load via staticFile or CSS)
// - Display: 'JetBrains Mono'
// - Body: 'Inter'

// Molten gradient
const moltenGradient = "linear-gradient(135deg, #FF4D00 0%, #FF8C00 50%, #FFB700 100%)";

// Glow effect
const moltenGlow = (intensity: number) => 
  `drop-shadow(0 0 ${30 * intensity}px rgba(255,77,0,0.8))`;
```

## Using World Labs Assets

The World Labs 3D world assets are available in `public/assets/world-labs/`:

```tsx
import { Img } from "remotion";

// Use as background
<Img 
  src="/assets/world-labs/smelter-foundry-pano.png" 
  style={{ width: "100%", height: "100%", objectFit: "cover" }}
/>

// Available assets:
// - smelter-foundry-pano.png (2.3MB panorama)
// - smelter-foundry-thumb.webp
// - chicken-hawk-thumb.webp
// - mystical-forest-thumb.webp
```

## Animation Patterns

### Fade In with Scale

```tsx
const frame = useCurrentFrame();
const { fps } = useVideoConfig();

const springScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
```

### Pulsing Glow

```tsx
const frame = useCurrentFrame();
const pulseFrame = (frame % 60) / 60;
const glowPulse = Math.sin(pulseFrame * Math.PI * 2) * 0.3 + 0.7;
```

### Staggered Text

```tsx
const items = ["ITEM1", "ITEM2", "ITEM3"];

{items.map((item, i) => (
  <div
    key={item}
    style={{
      opacity: interpolate(frame, [30 + i * 10, 50 + i * 10], [0, 1], { extrapolateRight: "clamp" }),
    }}
  >
    {item}
  </div>
))}
```

### Slow Zoom

```tsx
const zoom = interpolate(frame, [0, 150], [1, 1.1], { extrapolateRight: "clamp" });

<div style={{ transform: `scale(${zoom})` }}>
  {/* content */}
</div>
```

## Rendering Options

### Codecs

| Codec | Use Case | Command |
|-------|----------|---------|
| `h264` | General MP4 (most compatible) | `--codec=h264` |
| `h265` | Smaller files, less compatible | `--codec=h265` |
| `vp8` | WebM format | `--codec=vp8` |
| `prores` | Professional editing | `--codec=prores` |
| `gif` | Short loops | `--codec=gif` |

### Quality & Size

```bash
# High quality (slower, larger)
npx remotion render SmelterOSIntro out/high.mp4 --quality=100

# Lower quality (faster, smaller)
npx remotion render SmelterOSIntro out/low.mp4 --quality=50

# Custom resolution
npx remotion render SmelterOSIntro out/vertical.mp4 --scale=0.5
```

### Render specific frames

```bash
# Render frames 0-60 only (first 2 seconds at 30fps)
npx remotion render SmelterOSIntro out/preview.mp4 --frames=0-60
```

## Troubleshooting

### "Nothing loading" in Studio

1. Check if dev server is running: `npm run dev`
2. Verify port: default is `http://localhost:3000`
3. Check console for errors in browser DevTools

### Assets not loading

1. Ensure assets are in `public/` folder
2. Use absolute paths starting with `/`
3. Check file exists: `ls public/assets/world-labs/`

### Render fails

1. Check codec is installed (ffmpeg required for some codecs)
2. Try with `--codec=h264` (most compatible)
3. Check memory usage for long videos

## Integration with SmelterOS

The SmelterOS intro video uses:
- World Labs foundry panorama as background
- Molten glow animation
- SmelterOS branding and colors
- Tech stack footer (AVVA NOON, ACHEEVY, CHICKEN HAWK, WORLD LABS)

Render command:
```bash
cd apps/media-forge
npx remotion render SmelterOSIntro out/smelter-os-intro.mp4 --codec=h264 --quality=90
```

## Resources

- [Remotion Documentation](https://www.remotion.dev/docs)
- [Remotion Examples](https://github.com/remotion-dev/examples)
- [Animation Reference](https://www.remotion.dev/docs/animating-properties)
