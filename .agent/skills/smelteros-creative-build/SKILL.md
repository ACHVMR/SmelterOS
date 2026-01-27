---
name: smelteros-creative-build-directive
description: Master build directive for "The Smelt" landing page and core SmelterOS pages. Implements the Molten Forge creative vision with industrial-modern aesthetics.
---

# SmelterOS Creative Build Directive

> **Vision**: Move away from "Tron" aesthetic toward a professional, proprietary operating system look with industrial-modern fidelity.

---

## The Creative Vision: 'The Smelt' Landing Page

The landing screen (`/`) serves as the visual benchmark for SmelterOS.

### 1. Molten Pour Animation

#### The Crucible
- High-fidelity 3D-styled crucible tilts to pour a continuous stream of glowing orange metal
- Primary color: `#FF4D00` (Molten Base)
- Glow effect: `rgba(255, 77, 0, 0.6)` radiating outward
- Animation: Continuous pour with liquid metal physics

#### The Ingot Transition
- As liquid metal "fills" the central mold, the Ingot model transitions:
  - **Start**: Vibrant, semi-transparent orange glow
  - **End**: Solid, textured Ingot Bronze (`#3D2B1F`)
- Progress-based fill animation synced with data loading

#### The Boomer_Ang Orbit
- 17 animated "Boomerang" specialist icons orbit the pouring stream
- Each represents a Boomer_Ang specialist ready for deployment
- Orbit path: Elliptical, 360° rotation over 20 seconds
- Hover: Expand and show specialist details

### 2. Nixie Tube Data Visuals

#### System Telemetry Display
- **Uptime**: Days:Hours:Minutes:Seconds format
- **Agents Active**: Count of running Boomer_Ang agents
- **Memory Usage**: Real-time system allocation

#### Nixie Tube Aesthetic
- Orange glowing filaments (`#FF4D00`) inside glass vacuum tubes
- Dark glass background with subtle reflections
- "Legacy Industrial" high-end feel
- Flicker animation on data updates

#### Real-time Updates
- Tubes flicker slightly when data updates
- Sync with ADK (Agent Development Kit) telemetry feed
- Update interval: 1 second for time, 5 seconds for metrics

---

## Agent Kit Activation Architecture

| Kit | Strategic Implementation |
|-----|--------------------------|
| **ADK** | Powers the backend "Brain" of SmelterOS, managing the 17 Boomer_Ang agents and Ingot refinement logic |
| **A2UI** | Handles streaming agent-to-user communication. Used for real-time "Command Log" showing AVVA NOON's thoughts |
| **CopilotKit** | Orchestrates CopilotPopup and CopilotSidebar, allowing voice commands (via Groq Whisper) that UI immediately visualizes |
| **HeroUI** | Provides modern, responsive grid for Foundry Home and polished switches in Circuit Box |

---

## Core Pages Build Specification

### 1. Foundry Home (`/foundry`)

**Purpose**: The "Desktop" of SmelterOS

**Design Principles**:
- Minimalist dashboard using Zinc-950 surfaces
- System Teal (`#00C2B2`) accents for active elements
- Card-based layout with OS module hover effects

**Key Components**:
- System Health Overview (Nixie Tube style)
- Molten Feed (real-time data ingestion log)
- Quick Actions grid
- Agent Status sidebar

### 2. Circuit Box (`/circuit`)

**Purpose**: Tactical control center for infrastructure management

**Design Principles**:
- High-density management console
- Flat, modern switches with System Green glow on "ON" state
- Critical alerts use Red-Orange (`#E63900`)

**Key Components**:
- GCP Cloud Run container management
- Firestore data stream controls
- **Master Emergency Shutdown Button** (Red-Orange, prominent placement)
- Service health matrix

### 3. AVVA NOON Hub (`/avva-noon`)

**Purpose**: Neurological space for AI consciousness tuning

**Design Principles**:
- Indigo/Teal gradient background (OS side of brand)
- Brain wireframe visualization with System Teal synapses
- V.I.B.E. alignment gauges

**Key Components**:
- Infinity LM V.I.B.E. alignment controls
- Quint-Modal senses configuration
- Consciousness log (Ingot Bronze boxes)
- Synapse activity visualization

---

## Component Library Requirements

### Animation Components

```
src/components/animations/
├── MoltenPour.tsx          # Crucible pour animation
├── IngotTransition.tsx     # Liquid → solid transition
├── BoomerangOrbit.tsx      # Orbiting specialist icons
├── NixieTube.tsx           # Single nixie tube digit
├── NixieDisplay.tsx        # Multi-digit nixie display
└── SynapseNetwork.tsx      # Brain synapse visualization
```

### UI Components

```
src/components/ui/
├── CircuitSwitch.tsx       # Toggle with glow state
├── EmergencyButton.tsx     # Red-orange shutdown button
├── SystemGauge.tsx         # Circular progress gauge
├── TelemetryCard.tsx       # Metrics display card
└── CommandLog.tsx          # Real-time agent log
```

---

## Color Token Quick Reference

| Token | Hex | Usage |
|-------|-----|-------|
| `--molten-base` | `#FF4D00` | Crucible, pour, active smelting |
| `--molten-highlight` | `#FFB000` | Molten gold accents |
| `--molten-deep` | `#E63900` | Critical alerts, emergency |
| `--system-teal` | `#00C2B2` | OS logic, navigation |
| `--system-green` | `#32CD32` | Active states, success |
| `--ingot-bronze` | `#3D2B1F` | Solid ingots, logs |
| `--foundry-950` | `#09090B` | Primary background |
| `--foundry-800` | `#27272A` | Card surfaces |

---

## Animation Specifications

### Molten Pour

```typescript
// Framer Motion config
const pourAnimation = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { 
    pathLength: 1, 
    opacity: [0, 1, 1, 0.8],
    transition: { 
      duration: 3, 
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}
```

### Nixie Flicker

```typescript
const flickerAnimation = {
  animate: {
    opacity: [1, 0.7, 1, 0.9, 1],
    filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"],
    transition: { duration: 0.1, ease: "linear" }
  }
}
```

### Orbit Path

```typescript
const orbitAnimation = {
  animate: {
    rotate: 360,
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: "linear"
    }
  }
}
```

---

## Implementation Priority

1. **Phase 1: Landing Page**
   - [ ] Molten Pour animation
   - [ ] Ingot transition effect
   - [ ] Nixie Tube telemetry display
   - [ ] Boomer_Ang orbit

2. **Phase 2: Core Pages**
   - [ ] Foundry Home layout
   - [ ] Circuit Box controls
   - [ ] AVVA NOON hub

3. **Phase 3: Agent Integration**
   - [ ] ADK connectivity
   - [ ] A2UI streaming
   - [ ] CopilotKit voice commands

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/animations/MoltenPour.tsx` | Crucible animation |
| `src/components/animations/NixieTube.tsx` | Nixie tube component |
| `src/components/animations/NixieDisplay.tsx` | Multi-digit display |
| `src/components/animations/BoomerangOrbit.tsx` | Orbiting icons |
| `src/app/page.tsx` | Landing page (The Smelt) |
| `src/app/foundry/page.tsx` | Foundry Home |
| `src/app/circuit/page.tsx` | Circuit Box |
| `src/app/avva-noon/page.tsx` | AVVA NOON Hub |
