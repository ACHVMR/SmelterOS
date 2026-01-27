---
name: oracle-design
description: The specific design system and UI/UX guidelines for this application. Use this skill when generating frontend code, styling components, or making UI decisions.
---

# ORACLE Design System: SmelterOS Branding

This skill defines the visual language and component usage for SmelterOS. It balances a professional, clean UI with the illustrative "molten" brand identity.

---

## Core Principles

1. **Molten Professionalism** — Use clean, minimalist layouts (Zinc-950) with high-vibrancy accent gradients derived from the logo.

2. **Contextual Coding** — Use Orange gradients for "Smelter" activities (Forging, Alchemy, Processing) and Teal/Green gradients for "OS" activities (System, Logic, Agents).

3. **Consistency** — Reuse components. Avoid raw HTML tags.

---

## Color Palette

### Foundation

| Token | Hex | Usage |
|-------|-----|-------|
| **Background** | `#09090B` | Zinc-950, main app surface |
| **Text (Primary)** | `#FAFAFA` | Zinc-50, primary text |
| **Borders/Surfaces** | `#18181B` | Zinc-900, navigation |
| **Elevated Surfaces** | `#27272A` | Zinc-800, cards |

### Brand Accents (Gradients)

#### Molten Orange (Action)

| Token | Hex | Usage |
|-------|-----|-------|
| **Base** | `#FF4D00` | Vibrant Orange |
| **Highlight** | `#FFB000` | Gold |
| **Deep** | `#E63900` | Red-Orange for drips/accents |

```css
--molten-gradient: linear-gradient(135deg, #FF4D00 0%, #FFB000 100%);
--molten-deep: #E63900;
```

#### System Teal (Logic)

| Token | Hex | Usage |
|-------|-----|-------|
| **Base** | `#00C2B2` | Teal |
| **Highlight** | `#32CD32` | Vibrant Green |

```css
--system-gradient: linear-gradient(135deg, #00C2B2 0%, #32CD32 100%);
```

#### Ingot Bronze (Muted)

| Token | Hex | Usage |
|-------|-----|-------|
| **Base** | `#3D2B1F` | Dark Bronze |
| **Highlight** | `#6B5344` | Light Bronze |

```css
--ingot-bronze: #3D2B1F;
--ingot-highlight: #6B5344;
```

---

## CSS Variables Template

```css
:root {
  /* Foundation */
  --bg-primary: #09090B;
  --bg-secondary: #18181B;
  --bg-elevated: #27272A;
  --text-primary: #FAFAFA;
  --text-muted: #A1A1AA;
  
  /* Molten (Smelter Activities) */
  --molten-base: #FF4D00;
  --molten-highlight: #FFB000;
  --molten-deep: #E63900;
  --molten-gradient: linear-gradient(135deg, #FF4D00 0%, #FFB000 100%);
  
  /* System (OS Activities) */
  --system-teal: #00C2B2;
  --system-green: #32CD32;
  --system-gradient: linear-gradient(135deg, #00C2B2 0%, #32CD32 100%);
  
  /* Ingot Bronze */
  --ingot-bronze: #3D2B1F;
  --ingot-highlight: #6B5344;
}
```

---

## Component Guidelines

### Buttons

#### Smelter Buttons (Creation/Processing)

```css
.btn-smelter {
  background: var(--molten-gradient);
  color: #09090B;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-smelter:hover {
  transform: scale(1.02);
  box-shadow: 0 0 24px rgba(255, 77, 0, 0.4);
}
```

**Use for:** Forge, Create, Process, Refine, Submit

#### System Buttons (Navigation/Logic)

```css
.btn-system {
  background: var(--system-gradient);
  color: #09090B;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-system:hover {
  filter: brightness(1.1);
  box-shadow: 0 0 20px rgba(0, 194, 178, 0.4);
}
```

**Use for:** Activate, Run, Navigate, Check, Analyze

### Typography

| Element | Font | Weight |
|---------|------|--------|
| **Headers** | Space Grotesk / Inter | 600-700 |
| **Body** | Inter | 400 |
| **Code** | JetBrains Mono | 400 |

#### Molten Text Effect

```css
.text-molten {
  background: var(--molten-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

#### System Text Effect

```css
.text-system {
  background: var(--system-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## Brand Assets

### Chickenhawk Mascot

![Chickenhawk Mascot](./assets/chickenhawk-mascot.png)

The Chickenhawk is the spirited mascot of SmelterOS — a feisty, determined character that embodies the "scrappy underdog" energy of the platform.

#### Mascot Usage Guidelines

| Context | Usage | Notes |
|---------|-------|-------|
| **Empty States** | Show Chickenhawk with encouraging message | "Let's forge something great!" |
| **Loading States** | Chickenhawk in action pose | Pair with "Forging..." text |
| **Error States** | Chickenhawk with determined expression | "Let's try that again!" |
| **Onboarding** | Chickenhawk as guide | Welcome screens, tutorials |
| **Success States** | Chickenhawk celebrating | Task completion, achievements |

#### Color Palette from Mascot

| Element | Hex | Design Token |
|---------|-----|--------------|
| Feathers (Brown) | `#8B4513` | Complements Ingot Bronze |
| Beak/Feet (Orange) | `#FFA500` | Aligns with Molten Highlight |
| Chest (Cream) | `#F5DEB3` | Warm neutral accent |

---

## When to Use This Skill

1. **When generating frontend code** for any SmelterOS page
2. **When creating UI components** (Buttons, Cards, Badges)
3. **When defining CSS variables**
4. **When adding mascot illustrations** to empty/loading/error states

---

## Quick Reference: Action Classification

| Smelter Actions (Orange) | OS Actions (Teal/Green) |
|--------------------------|-------------------------|
| Forge | Activate |
| Create | Run |
| Process | Navigate |
| Refine | Check |
| Submit | Analyze |
| Upload | Configure |
| Transform | Monitor |
