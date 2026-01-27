---
name: smelteros-design-system
description: The official SmelterOS visual identity and design system. Use this when creating UI components, styling pages, or ensuring brand consistency.
---

# SmelterOS Design System

The ORACLE Design System blends a professional **"Modern-Zinc"** layout with high-vibrancy **"Molten"** and **"System"** accents derived from the SmelterOS logo.

---

## Core Color Palette

### Foundation Colors

| Token | Hex | CSS Variable | Usage |
|-------|-----|--------------|-------|
| **Foundry Background** | `#09090B` | `--foundry-bg` | Main app surface (Zinc-950) |
| **Ingot Bronze** | `#3D2B1F` | `--ingot-bronze` | Muted secondary surfaces, historical logs |
| **Zinc-900** | `#18181B` | `--zinc-900` | Navigation, card backgrounds |
| **Zinc-800** | `#27272A` | `--zinc-800` | Elevated surfaces, cards |

### Molten Gradient (Smelter Activities)

| Token | Value | Usage |
|-------|-------|-------|
| **Molten Start** | `#FF4D00` | Forging, Refinement, Action States |
| **Molten End** | `#FFB000` | Progress indicators, drip effects |
| **Deep Red-Orange** | `#E63900` | Critical failures, "High Heat" alerts |

```css
--molten-gradient: linear-gradient(135deg, #FF4D00 0%, #FFB000 100%);
```

### System Gradient (OS Activities)

| Token | Value | Usage |
|-------|-------|-------|
| **System Teal** | `#00C2B2` | AI Agents, Logic, Active synapses |
| **System Green** | `#32CD32` | System Stats, "ON" states, OPTIMAL status |

```css
--system-gradient: linear-gradient(135deg, #00C2B2 0%, #32CD32 100%);
```

---

## Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| **Headers** | JetBrains Mono | 700 | 24px - 48px |
| **Body** | Inter | 400 | 14px - 16px |
| **Code/Terminal** | JetBrains Mono | 400 | 13px |
| **Labels** | Inter | 500 | 12px |

---

## Component Specifications

### Buttons

| Type | Style | Hover |
|------|-------|-------|
| **Forge Button** | `--molten-gradient` background | Glow effect + scale(1.02) |
| **Activate Button** | Solid `#00C2B2` background | Brightness(1.1) |
| **Secondary** | Zinc-800 + white text | Zinc-700 background |

### Cards

```css
.card-default {
  background: var(--zinc-800);
  border: 1px solid var(--zinc-700);
  border-radius: 12px;
}

.card-hover-smelter:hover {
  border-color: #FF4D00;
  box-shadow: 0 0 20px rgba(255, 77, 0, 0.3);
}

.card-hover-os:hover {
  border-color: #32CD32;
  box-shadow: 0 0 20px rgba(50, 205, 50, 0.3);
}
```

### Status Badges

| Status | Style |
|--------|-------|
| **OPTIMAL** | `--system-gradient` background |
| **PROCESSING** | `--molten-gradient` background |
| **CRITICAL** | Solid `#E63900` background |

### Switches (Circuit Box)

```css
.switch-on {
  background: #32CD32;
  box-shadow: 0 0 12px rgba(50, 205, 50, 0.6);
}

.switch-off {
  background: var(--zinc-700);
}
```

---

## Page-by-Page Specifications

### 1. The Foundry (Home Dashboard)

**Layout:** Multi-column professional layout

| Element | Specification |
|---------|---------------|
| **Furnace Header** | Horizontal span, subtle orange glow at bottom edge |
| **Left Nav** | Zinc-900 background, icons highlighted in System Teal |
| **Molten Feed** | Real-time data with orange "drip" animation on new items |
| **System Health** | Teal-to-green gradient for OPTIMAL badge |

```css
.furnace-header {
  background: linear-gradient(to bottom, #18181B 0%, #09090B 100%);
  border-bottom: 2px solid transparent;
  border-image: linear-gradient(90deg, transparent, #FF4D00, transparent) 1;
}
```

---

### 2. AVVA NOON Consciousness Hub

**Theme:** Teal/Indigo blend (OS side of brand)

| Element | Specification |
|---------|---------------|
| **Brain Wireframe** | System Teal (`#00C2B2`) for active synapses |
| **V.I.B.E. Check Gauge** | Molten gradient = intensity, Teal = alignment |
| **Consciousness Log** | White text on Ingot Bronze (`#3D2B1F`) boxes |

```css
.synapse-active {
  stroke: #00C2B2;
  filter: drop-shadow(0 0 8px rgba(0, 194, 178, 0.8));
}

.consciousness-log-entry {
  background: #3D2B1F;
  color: #FFFFFF;
  border-radius: 8px;
  padding: 16px;
}
```

---

### 3. Module Garden (Storefront)

**Layout:** Grid of Zinc-800 cards

| Interaction | Specification |
|-------------|---------------|
| **Smelter Module Hover** | Molten Orange border (`#FF4D00`) |
| **OS Module Hover** | System Green border (`#32CD32`) |
| **Activate Button** | Solid Teal |
| **Forge Button** | Orange/Yellow gradient |

```css
.module-card {
  background: var(--zinc-800);
  transition: all 0.3s ease;
}

.module-card.smelter:hover {
  border: 2px solid #FF4D00;
  box-shadow: 0 4px 24px rgba(255, 77, 0, 0.25);
}

.module-card.os:hover {
  border: 2px solid #32CD32;
  box-shadow: 0 4px 24px rgba(50, 205, 50, 0.25);
}
```

---

### 4. Circuit Box (Professional View)

**Design:** High-density management console

| Element | Specification |
|---------|---------------|
| **Switches** | Flat, modern. "ON" = Sharp System Green glow |
| **Alerts** | Deep Red-Orange (`#E63900`) for "High Heat" issues |

```css
.circuit-switch.on {
  background: #32CD32;
  box-shadow: 
    0 0 4px rgba(50, 205, 50, 0.8),
    0 0 12px rgba(50, 205, 50, 0.4);
}

.alert-critical {
  background: linear-gradient(135deg, #E63900 0%, #FF4D00 100%);
  animation: pulse-heat 1.5s ease-in-out infinite;
}
```

---

### 5. House of Alchemist (Forge UI)

**Design:** Most branding-heavy page with subtle heat map texture

| Element | Specification |
|---------|---------------|
| **Background** | Subtle "Heat Map" texture overlay |
| **Ingot Cards** | 3D-styled bronze (`#3D2B1F`) |
| **Refining Progress** | Molten Orange gradient fill |
| **Forge Wizard** | Logo typography for "Refining..." headers |

```css
.ingot-card {
  background: linear-gradient(145deg, #4A3628 0%, #3D2B1F 100%);
  border-radius: 12px;
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.5);
}

.ingot-card.refining {
  background: linear-gradient(
    to right,
    #FF4D00 0%,
    #FFB000 var(--progress),
    #3D2B1F var(--progress)
  );
}

.forge-header {
  font-family: 'JetBrains Mono', monospace;
  background: var(--molten-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## Animation Library

### Molten Drip (New Data)

```css
@keyframes molten-drip {
  0% {
    opacity: 0;
    transform: translateY(-20px);
    filter: brightness(1.5);
  }
  50% {
    filter: brightness(1.2);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    filter: brightness(1);
  }
}

.new-data-item {
  animation: molten-drip 0.5s ease-out;
}
```

### System Pulse (Active States)

```css
@keyframes system-pulse {
  0%, 100% {
    box-shadow: 0 0 8px rgba(0, 194, 178, 0.4);
  }
  50% {
    box-shadow: 0 0 20px rgba(0, 194, 178, 0.8);
  }
}

.system-active {
  animation: system-pulse 2s ease-in-out infinite;
}
```

### Heat Pulse (Critical Alerts)

```css
@keyframes pulse-heat {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 8px rgba(230, 57, 0, 0.5);
  }
  50% {
    opacity: 0.85;
    box-shadow: 0 0 24px rgba(230, 57, 0, 0.8);
  }
}
```

---

## Quick Reference: Module Classification

| Category | Examples | Accent Color |
|----------|----------|--------------|
| **Smelter** | Ingot Processing, Forging, Refinement | Molten Orange |
| **OS** | AI Agents, System Stats, Logic, AVVA NOON | System Teal/Green |

---

## When to Use This Skill

1. **Creating new UI components** — Reference the color tokens and component specs
2. **Styling pages** — Follow page-by-page specifications
3. **Adding animations** — Use the animation library
4. **Ensuring brand consistency** — Check module classification for correct accent colors
