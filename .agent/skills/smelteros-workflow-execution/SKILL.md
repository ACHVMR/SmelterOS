---
name: smelteros-workflow-execution
description: Automated workflow execution patterns for SmelterOS development. Use this for CI/CD, deployments, and complex multi-step operations.
---

# SmelterOS Workflow Execution

Standard operating procedures for complex development workflows.

---

## 🚀 Deployment Workflows

### Deploy to Firebase Hosting

**Prerequisites:**
- Firebase CLI installed (`npm install -g firebase-tools`)
- Logged in to Firebase (`firebase login`)

**Steps:**
```powershell
# 1. Navigate to project root
cd c:\Users\rishj\OneDrive\Desktop\The SmelterOS

# 2. Build the Next.js app
cd apps/web
npm run build

# 3. Deploy to Firebase
cd ../..
firebase deploy --only hosting
```

**Post-Deployment Verification:**
1. Open https://smelteros.web.app (or your Firebase URL)
2. Test all major routes
3. Check browser console for errors
4. Verify images and assets load

---

### Deploy to Google Cloud Run

**Prerequisites:**
- gcloud CLI installed and configured
- Docker installed and running

**Steps:**
```powershell
# 1. Navigate to project root
cd c:\Users\rishj\OneDrive\Desktop\The SmelterOS

# 2. Build the Docker image
docker build -t gcr.io/[PROJECT_ID]/smelteros:latest .

# 3. Push to Container Registry
docker push gcr.io/[PROJECT_ID]/smelteros:latest

# 4. Deploy to Cloud Run
gcloud run deploy smelteros \
  --image gcr.io/[PROJECT_ID]/smelteros:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Alternative: Use cloudbuild.yaml**
```powershell
gcloud builds submit --config=cloudbuild.yaml
```

---

## 🔧 Development Workflows

### Start New Feature Branch

```powershell
# 1. Ensure on main branch with latest
cd c:\Users\rishj\OneDrive\Desktop\The SmelterOS
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/feature-name

# 3. Start development server
cd apps/web
npm run dev
```

---

### Create New Page Workflow

**Step 1: Create the page file**
```
apps/web/src/app/[route-name]/page.tsx
```

**Step 2: Use page template**
```tsx
"use client"

export default function NewPage() {
  return (
    <div className="min-h-screen bg-[#181311] text-white">
      {/* Page content */}
    </div>
  )
}
```

**Step 3: Add to navigation** (if applicable)
Update the TopNav component to include link to new route.

**Step 4: Test the route**
Navigate to `http://localhost:3000/[route-name]`

---

### Create New Component Workflow

**Step 1: Determine component category**
| Category | Path | Example |
|----------|------|---------|
| Base UI | `components/ui/` | Button, Card, Input |
| Animations | `components/animations/` | MoltenPour, NixieTube |
| Layout | `components/layout/` | Header, Sidebar, Footer |
| Features | `components/features/` | ModuleCard, AgentPanel |

**Step 2: Create component file**
```
apps/web/src/components/[category]/ComponentName.tsx
```

**Step 3: Implement with TypeScript**
```tsx
"use client"

interface ComponentNameProps {
  // Props
}

export function ComponentName({ ...props }: ComponentNameProps) {
  return (
    // JSX
  )
}
```

**Step 4: Export (optional barrel export)**
Update `components/[category]/index.ts` if exists.

---

## 🔄 Backend Integration Workflows

### Connect to Firestore

**Step 1: Configure Firebase**
```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ...
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
```

**Step 2: Create data hook**
```typescript
// hooks/useFirestoreCollection.ts
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useFirestoreCollection(collectionName: string) {
  // Implementation
}
```

---

### Connect to Backend API

**Step 1: Create API client**
```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL

export async function fetchFromAPI(endpoint: string, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }
  
  return response.json()
}
```

**Step 2: Use in components**
```typescript
import { fetchFromAPI } from '@/lib/api'

// In event handler or effect
const data = await fetchFromAPI('/agents')
```

---

## 🐳 Docker Workflows

### Start All Services

```powershell
cd c:\Users\rishj\OneDrive\Desktop\The SmelterOS
docker-compose up -d
```

### View Service Logs

```powershell
docker-compose logs -f [service-name]
```

### Rebuild Single Service

```powershell
docker-compose up -d --build [service-name]
```

### Stop All Services

```powershell
docker-compose down
```

### Clean Docker Resources

```powershell
docker system prune -f
docker volume prune -f
```

---

## 🧪 Testing Workflows

### Run Unit Tests (if configured)

```powershell
cd c:\Users\rishj\OneDrive\Desktop\The SmelterOS\apps\web
npm test
```

### Manual Testing Checklist

**Desktop Testing:**
- [ ] All pages load correctly
- [ ] Navigation works
- [ ] Forms submit properly
- [ ] Animations run smoothly
- [ ] No console errors

**Mobile Testing:**
- [ ] Responsive layouts work
- [ ] Touch interactions work
- [ ] No horizontal scroll
- [ ] Text is readable

**Cross-Browser:**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Edge

---

## 🔐 Environment Setup Workflow

### Initial Project Setup

```powershell
# 1. Clone repository
git clone [repo-url]
cd The SmelterOS

# 2. Install root dependencies (if any)
npm install

# 3. Install web app dependencies
cd apps/web
npm install

# 4. Copy environment file
Copy-Item .env.example .env.local

# 5. Edit .env.local with your values
notepad .env.local

# 6. Start development
npm run dev
```

### Required Environment Variables

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# Backend API
NEXT_PUBLIC_API_URL=

# Optional: AI Services
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

---

## 📦 Release Workflow

### Prepare Release

```powershell
# 1. Ensure on main with all changes
git checkout main
git pull origin main

# 2. Create release branch
git checkout -b release/v1.x.x

# 3. Update version in package.json
# (manual or use npm version)

# 4. Build and test
cd apps/web
npm run build

# 5. Commit version bump
git add .
git commit -m "chore: bump version to v1.x.x"

# 6. Tag release
git tag v1.x.x

# 7. Push
git push origin release/v1.x.x --tags
```

---

## 🎯 When to Use This Skill

1. **Deploying the application** — Follow deployment workflows
2. **Setting up development** — Use environment setup workflow
3. **Creating new features** — Follow feature development workflows
4. **Backend integration** — Use API/Firestore connection workflows
5. **Managing Docker services** — Follow Docker workflows
6. **Preparing releases** — Use release workflow

---

## 📋 Quick Command Reference

| Action | Command |
|--------|---------|
| Start dev server | `npm run dev` |
| Build production | `npm run build` |
| Deploy Firebase | `firebase deploy` |
| Start Docker | `docker-compose up -d` |
| Stop Docker | `docker-compose down` |
| Git status | `git status` |
| Create branch | `git checkout -b name` |
| Commit all | `git add . && git commit -m "msg"` |
