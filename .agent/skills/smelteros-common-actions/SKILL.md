---
name: smelteros-common-actions
description: Redundant and repetitive actions for SmelterOS development. Use this to avoid repeating common tasks and ensure consistency across the codebase.
---

# SmelterOS Common Actions

Quick reference for frequently performed development tasks. Use these to maintain consistency and reduce errors.

---

## 🧭 Skill Activation Router

**Use this table to activate the correct skill based on your task:**

| Task Pattern | Activate Skill | Path |
|--------------|----------------|------|
| Building UI, styling, colors, components | **smelteros-design-system** | `.agent/skills/smelteros-design-system/` |
| Page layouts, buttons, cards, forms | **smelteros-ui-patterns** | `.agent/skills/smelteros-ui-patterns/` |
| Landing page, animations, Nixie tubes | **smelteros-creative-build-directive** | `.agent/skills/smelteros-creative-build/` |
| Deployments, CI/CD, Docker, releases | **smelteros-workflow-execution** | `.agent/skills/smelteros-workflow-execution/` |
| Images, assets, logos, backgrounds | **smelteros-image-assets** | `.agent/skills/smelteros-image-assets/` |
| MCP servers, ACP, UCP, Sanity, Composio | **smelteros-mcp-management** | `.agent/skills/smelteros-mcp-management/` |
| Data flow, state, architecture | **oracle-architecture** | `.agent/skills/oracle-architecture/` |
| Design guidelines, brand identity | **oracle-design** | `.agent/skills/oracle-design/` |
| Dev commands, git, troubleshooting | **smelteros-common-actions** | (this skill) |

### Quick Activation Commands

When you need a specific skill, say:
- *"Use the design system skill"*
- *"Activate UI patterns"*
- *"Load workflow execution skill"*
- *"Apply MCP management"*

---


## 🔥 Project Structure Reference

```
The SmelterOS/
├── apps/web/                     # Next.js web application
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages
│   │   ├── components/           # React components
│   │   │   ├── ui/               # Base UI components (buttons, cards, etc.)
│   │   │   └── animations/       # Framer Motion animations
│   │   └── lib/                  # Utilities and helpers
│   ├── public/                   # Static assets
│   │   └── assets/               # Images, logos, backgrounds
│   └── tailwind.config.ts        # Tailwind configuration
├── smelter/                      # Backend services
│   └── services/                 # Docker Compose services
├── chickenhawk/                  # Chicken Hawk Agent Framework
└── .agent/                       # Agent configuration
    ├── skills/                   # Skill definitions (this folder)
    └── workflows/                # Workflow definitions
```

---

## 🚀 Development Server Commands

### Start Next.js Dev Server
```powershell
cd c:\Users\rishj\OneDrive\Desktop\The SmelterOS\apps\web
npm run dev
```
**URL**: http://localhost:3000

### Build for Production
```powershell
cd c:\Users\rishj\OneDrive\Desktop\The SmelterOS\apps\web
npm run build
```

### Start Docker Services
```powershell
cd c:\Users\rishj\OneDrive\Desktop\The SmelterOS
docker-compose up -d
```

---

## 📦 Package Management

### Install a New Package
```powershell
cd c:\Users\rishj\OneDrive\Desktop\The SmelterOS\apps\web
npm install <package-name>
```

### Install Dev Dependency
```powershell
cd c:\Users\rishj\OneDrive\Desktop\The SmelterOS\apps\web
npm install -D <package-name>
```

### Common Packages Used
| Package | Purpose |
|---------|---------|
| `framer-motion` | Animations |
| `@heroui/react` | UI components |
| `lucide-react` | Icons |
| `tailwindcss` | Styling |
| `@tanstack/react-query` | Data fetching |

---

## 🎨 Component Creation Checklist

When creating a new component:

1. **Create the component file**:
   ```
   apps/web/src/components/[category]/ComponentName.tsx
   ```

2. **Use the standard template**:
   ```typescript
   "use client"

   import { type ComponentProps } from "react"

   interface ComponentNameProps {
     // Define props here
   }

   export function ComponentName({ ...props }: ComponentNameProps) {
     return (
       <div>
         {/* Component content */}
       </div>
     )
   }
   ```

3. **Export from index** (if applicable):
   ```typescript
   export { ComponentName } from "./ComponentName"
   ```

4. **Follow SmelterOS Design System** for colors and styling

---

## 🖼️ Asset Management

### Image Locations
| Type | Path |
|------|------|
| Hero Images | `/apps/web/public/` |
| Logo Assets | `/apps/web/public/assets/` |
| Icons | Use `lucide-react` or Material Symbols |

### Current Key Assets
| Asset | Path |
|-------|------|
| Smelter Hero | `/apps/web/public/smelter-hero.png` |
| SmelterOS Logo | `/apps/web/public/smelteros-logo.jpg` |
| Full Logo | `/apps/web/public/assets/smelter-logo-full.png` |
| Magma Background | `/apps/web/public/assets/magma-bg.jpg` |

### Adding New Images
1. Place in `/apps/web/public/` or `/apps/web/public/assets/`
2. Reference with leading slash: `src="/smelter-hero.png"` or `src="/assets/magma-bg.jpg"`

---

## 🔄 Common Git Operations

### Commit with Message
```powershell
git add .
git commit -m "feat: description of change"
```

### Push to Main
```powershell
git push origin main
```

### Pull Latest
```powershell
git pull origin main
```

### Commit Message Prefixes
| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `style:` | UI/styling changes |
| `refactor:` | Code refactoring |
| `docs:` | Documentation |
| `chore:` | Maintenance |

---

## 🔧 Troubleshooting

### Clear Next.js Cache
```powershell
cd c:\Users\rishj\OneDrive\Desktop\The SmelterOS\apps\web
Remove-Item -Recurse -Force .next
npm run dev
```

### Reinstall Dependencies
```powershell
cd c:\Users\rishj\OneDrive\Desktop\The SmelterOS\apps\web
Remove-Item -Recurse -Force node_modules
npm install
```

### TypeScript Errors
```powershell
cd c:\Users\rishj\OneDrive\Desktop\The SmelterOS\apps\web
npx tsc --noEmit
```

---

## 📋 Pre-Deploy Checklist

1. [ ] Run `npm run build` successfully
2. [ ] Test all routes manually
3. [ ] Verify responsive design (mobile/tablet/desktop)
4. [ ] Check for console errors
5. [ ] Validate all images load
6. [ ] Test any form submissions
7. [ ] Confirm environment variables are set

---

## 🎯 When to Use This Skill

- **Starting work sessions** — Review project structure
- **Creating new components** — Follow the checklist
- **Managing assets** — Check asset locations
- **Troubleshooting** — Use common fixes
- **Preparing for deployment** — Run pre-deploy checklist
