# SPEC 001: PHOENIX REBUILD & MIGRATION

## OBJECTIVE
Execute a "Phoenix Rebuild" of the Frontend to eliminate technical debt, enforce the new "Matrix" aesthetic, and decouple the UI from heavy backend logic.

## SCOPE
- **New Repo Structure**: Establish a clean monorepo or strict folder separation.
- **Scaffold UX**: Create the "Terminal Container" shell and "Jack-In" (Login) page.
- **Asset Migration**: Port existing revenue (Stripe) and communications (Resend) integrations carefully.
- **Backend Stubbing**: Ensure the new UI can talk to existing Cloud Run endpoints.

## CURRENT STATE ASSESSMENT (PHASE 1 SUMMARY)
- **Legacy**: Existing `apps/web` contains mixed concerns and drift. Root contains Next.js config but missing some files.
- **Infra**: `firebase.json` points to `smelteros-next`. Cloud Run Services exist for agents.
- **Risk**: High coupling in current `page.tsx` between UI and logic. IDE warnings on config files.

## EXECUTION PLAN (ROUTE C: HYBRID)

### Phase 1: Foundation
1. [ ] Create new app directory: `apps/console`.
2. [ ] Initialize Next.js 14+ (App Router).
3. [ ] Install Tailwind CSS + `shadcn/ui`.
4. [ ] Configure `font-family`: JetBrains Mono & Inter.
5. [ ] Create global `layout.tsx` with "CRT/Glitch" overlay effects.

### Phase 2: Core Components
6. [ ] Build `TerminalContainer`: The main wrapper with window chrome.
7. [ ] Build `GlitchText`: The signature typography effect.
8. [ ] Build `StreamView`: A component to render streaming logs from Firestore/API.

### Phase 3: Migration
9. [ ] Move `Stripe` payment links/webhooks to `services/payments` or keep in `apps/console/api` if lightweight.
10. [ ] Re-implement Auth (Firebase Client SDK).

## ACCEPTANCE CRITERIA
- [ ] `npm run dev` starts the new Console without errors.
- [ ] UI reflects "Dark Mode / Terminal" aesthetic by default.
- [ ] No "heavy" agent code (LangChain/AutoGPT etc.) is present in the Client bundle.
- [ ] CI/CD pipeline builds the generic Docker container for the new Console.
