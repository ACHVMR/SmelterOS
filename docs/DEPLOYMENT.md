# SmelterOS Static Deployment Guide

## Overview

SmelterOS is configured for **static export** deployment. No Vercel required.

## Build for Static Export

```bash
cd apps/web
npm run build
```

This generates a static site in the `out/` folder.

## Deployment Options

### 1. Cloudflare Pages (Recommended)

**Free tier includes:**
- Unlimited bandwidth
- Global CDN
- Custom domains
- SSL/HTTPS

**Steps:**
1. Push code to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
3. Connect your repository
4. Set build settings:
   - **Build command:** `cd apps/web && npm run build`
   - **Output directory:** `apps/web/out`
5. Deploy!

**Custom domain:**
```
smelteros.com → CNAME → your-project.pages.dev
```

---

### 2. Netlify

**Free tier includes:**
- 100GB bandwidth/month
- Continuous deployment
- Custom domains
- Forms/Functions

**Steps:**
1. Push code to GitHub
2. Go to [Netlify](https://netlify.com)
3. Import your repository
4. Set build settings:
   - **Build command:** `cd apps/web && npm run build`
   - **Publish directory:** `apps/web/out`
5. Deploy!

**netlify.toml (optional):**
```toml
[build]
  command = "cd apps/web && npm run build"
  publish = "apps/web/out"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### 3. GitHub Pages

**Free for public repos**

**Steps:**
1. Build locally: `cd apps/web && npm run build`
2. Add to `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: cd apps/web && npm ci
        
      - name: Build
        run: cd apps/web && npm run build
        
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./apps/web/out
```

---

### 4. Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (select Hosting)
firebase init

# Deploy
cd apps/web
npm run build
firebase deploy
```

**firebase.json:**
```json
{
  "hosting": {
    "public": "apps/web/out",
    "ignore": ["firebase.json", "**/.*"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

---

### 5. Manual Upload (Any Host)

1. Build: `cd apps/web && npm run build`
2. Upload contents of `apps/web/out/` to your hosting provider
3. Configure redirects for SPA routing (if needed)

---

## Service Routes

| Route | Service | Description |
|-------|---------|-------------|
| `/` | Hub | SmelterOS landing page |
| `/foundry/` | Foundry | Mission control dashboard |
| `/avva-noon/` | AVVA NOON | Brain interface |
| `/dashboard/` | ACHEEVY | Executor portal |
| `/chickenhawk/` | Chicken Hawk | Coding agent |
| `/circuit/` | Circuit Box | Workflow builder |
| `/guild/` | Guild | Agent marketplace |
| `/governance/` | Governance | Admin panel |

---

## Custom Domain Setup

### DNS Configuration

For `smelteros.com`:

| Type | Name | Value |
|------|------|-------|
| CNAME | www | your-deployment.netlify.app |
| A | @ | 76.76.21.21 (Netlify) |

For Cloudflare Pages:
| Type | Name | Value |
|------|------|-------|
| CNAME | @ | your-project.pages.dev |

---

## SSL/HTTPS

All recommended platforms provide free SSL:
- Cloudflare Pages: Automatic
- Netlify: Automatic
- Firebase: Automatic
- GitHub Pages: Automatic

---

## Environment Variables

For builds requiring API keys, set in your platform's dashboard:

```
NEXT_PUBLIC_WORLD_LABS_KEY=your_key
NEXT_PUBLIC_API_URL=https://api.smelteros.com
```

---

## Quick Commands

```bash
# Development
cd apps/web && npm run dev

# Production build
cd apps/web && npm run build

# Preview production build
cd apps/web && npx serve out

# Check build size
du -sh apps/web/out
```
