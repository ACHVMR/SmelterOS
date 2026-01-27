---
name: smelteros-image-assets
description: Image asset library and generation guidelines for SmelterOS. Use this when working with visual assets, backgrounds, and generated imagery.
---

# SmelterOS Image Assets Library

Reference catalog of all visual assets and guidelines for creating new ones.

---

## 🖼️ Current Asset Inventory

### Hero Images

| Asset | Path | Dimensions | Description |
|-------|------|------------|-------------|
| **Smelter Hero** | `/apps/web/public/smelter-hero.png` | 740KB | Foundry worker controlling molten metal pour, dramatic industrial scene with glowing magma |

### Logo Assets

| Asset | Path | Dimensions | Description |
|-------|------|------------|-------------|
| **SmelterOS Logo** | `/apps/web/public/smelteros-logo.jpg` | 512KB | Main SmelterOS logo |
| **Full Logo PNG** | `/apps/web/public/assets/smelter-logo-full.png` | 658KB | Transparent full logo for headers |
| **Chicken Hawk Logo** | `/apps/web/public/chickenhawk-logo.png` | 299KB | Chicken Hawk framework logo |
| **Chicken Hawk Mascot** | `/apps/web/public/chickenhawk-mascot.png` | 503KB | Chicken Hawk mascot character |

### Background Patterns

| Asset | Path | Description |
|-------|------|-------------|
| **Foundry Grid** | CSS Pattern | Linear gradient grid pattern |
| **Circuit Pattern** | CSS SVG | Circuit board pattern overlay |

---

## 🎨 Image Generation Guidelines

When generating new images for SmelterOS, follow these creative directions:

### Visual Style: "Molten Forge"

**Key Elements:**
- Industrial foundry environments
- Molten metal / magma
- Dark, dramatic lighting
- High contrast (deep shadows, bright orange/gold highlights)
- Professional, high-fidelity renders
- Cinematic composition

**Color Palette:**
| Color | Hex | Usage |
|-------|-----|-------|
| Molten Orange | `#FF4D00` | Liquid metal, fire |
| Molten Gold | `#FFB000` | Highlights, sparks |
| Deep Red | `#E63900` | Hot coals, intensity |
| Foundry Black | `#09090B` | Shadows, backgrounds |
| Bronze | `#3D2B1F` | Cooled metal, surfaces |

### Prompt Templates

**Hero Background:**
```
A dramatic smelting furnace pouring molten magma, industrial foundry setting, 
glowing orange-gold liquid metal flowing toward the viewer, sparks flying, 
dark atmospheric environment, cinematic lighting, professional render, 
16:9 aspect ratio, 4K quality
```

**Module Cards:**
```
Abstract representation of [module concept], industrial foundry aesthetic,
dark background with molten orange accents, clean modern design,
professional tech visualization, 16:9 aspect ratio
```

**Icon/Logo:**
```
Minimalist industrial logo design, foundry/smelting theme,
molten orange on dark background, clean vector style,
professional branding, 1:1 aspect ratio
```

---

## 📁 Asset Organization

### Directory Structure

```
apps/web/public/
├── smelter-hero.png           # Main hero image
├── smelteros-logo.jpg         # Primary logo
├── chickenhawk-logo.png       # Framework logo
├── chickenhawk-mascot.png     # Mascot image
├── assets/
│   ├── smelter-logo-full.png  # Transparent logo
│   ├── magma-bg.jpg           # Background image
│   ├── landing-ref.jpg        # Reference image
│   └── img/                   # Additional images
├── file.svg                   # Utility icons
├── globe.svg
├── next.svg
├── vercel.svg
└── window.svg
```

### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Hero Images | `[subject]-hero.png` | `smelter-hero.png` |
| Backgrounds | `[name]-bg.jpg` | `magma-bg.jpg` |
| Logos | `[brand]-logo.png` | `smelteros-logo.png` |
| Icons | `[name]-icon.svg` | `forge-icon.svg` |
| Screenshots | `[feature]-screenshot.png` | `dashboard-screenshot.png` |

---

## 🔧 Image Usage Patterns

### In Next.js Components

**Optimized Image (recommended):**
```tsx
import Image from 'next/image'

<Image
  src="/smelter-hero.png"
  alt="Smelter foundry scene"
  width={1200}
  height={800}
  priority
  className="object-cover"
/>
```

**Background Image:**
```tsx
<div 
  className="absolute inset-0 bg-cover bg-center"
  style={{ backgroundImage: 'url("/assets/magma-bg.jpg")' }}
/>
```

**Logo in Header:**
```tsx
<img 
  src="/assets/smelter-logo-full.png" 
  alt="SmelterOS" 
  className="h-10 w-auto object-contain"
/>
```

### With Gradient Overlays

```tsx
<div className="relative">
  {/* Background Image */}
  <div 
    className="absolute inset-0 bg-cover bg-center"
    style={{ backgroundImage: 'url("/smelter-hero.png")' }}
  />
  
  {/* Gradient Overlays */}
  <div className="absolute inset-0 bg-gradient-to-r from-[#0f0c08] via-[#0f0c08]/90 to-transparent" />
  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0c08] via-transparent to-[#0f0c08]/50" />
  
  {/* Content */}
  <div className="relative z-10">
    {/* Your content */}
  </div>
</div>
```

---

## 📏 Recommended Image Sizes

| Use Case | Dimensions | Format | Max Size |
|----------|------------|--------|----------|
| Hero Full-width | 1920x1080 | PNG/JPG | 1MB |
| Background | 1920x1080 | JPG | 500KB |
| Card Thumbnail | 400x300 | JPG/WebP | 100KB |
| Logo (Header) | 200x60 | PNG | 50KB |
| Logo (Full) | 800x200 | PNG | 200KB |
| Icon | 64x64 | SVG/PNG | 10KB |
| Favicon | 32x32 | ICO/PNG | 5KB |

---

## 🛠️ Image Optimization

### Before Adding Images

1. **Resize** to appropriate dimensions
2. **Compress** using tools like:
   - TinyPNG (https://tinypng.com)
   - Squoosh (https://squoosh.app)
3. **Convert** to WebP where possible for better performance
4. **Check** file size is within limits

### Next.js Image Optimization

The `next/image` component automatically:
- Serves WebP format when supported
- Lazy loads images by default
- Prevents Cumulative Layout Shift
- Resizes images on-demand

---

## 🎯 When to Use This Skill

1. **Adding new images** — Check asset inventory and naming conventions
2. **Generating images** — Use the prompt templates and style guidelines
3. **Optimizing images** — Follow the size recommendations
4. **Implementing images** — Use the usage patterns
5. **Organizing assets** — Follow directory structure

---

## 📋 Quick Reference

### Image File Paths

```javascript
// From components:
"/smelter-hero.png"           // Hero image
"/assets/magma-bg.jpg"        // Background
"/assets/smelter-logo-full.png" // Logo

// With Next.js Image:
import Image from 'next/image'
<Image src="/smelter-hero.png" ... />
```

### CSS Background Patterns

```css
/* Foundry Grid */
background-image: linear-gradient(to right, #3a2c27 1px, transparent 1px),
                  linear-gradient(to bottom, #3a2c27 1px, transparent 1px);
background-size: 40px 40px;

/* Circuit Pattern */
background-image: url("data:image/svg+xml,...");
```
