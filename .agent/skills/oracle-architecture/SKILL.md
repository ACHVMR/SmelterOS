---
name: oracle-architecture
description: The structural blueprint of the application, including data flow, state management, and file organization. Use this when creating new modules or debugging data issues.
---

# ORACLE Architecture Guide

This skill provides the "mental map" of the application.

---

## Directory Structure

| Path | Purpose |
|------|---------|
| `/src/components` | Dumb, presentational components only. **No business logic.** |
| `/src/features` | Smart components and slice logic (Redux/Context). |
| `/src/hooks` | Custom hooks for shared logic. |
| `/src/services` | API calls and external integrations. |

---

## State Management

### Global State
- Use the store defined in `/src/store`.
- **Do not create new contexts without approval.**

### Local State
- Use `useState` for UI toggles only (modals, dropdowns).

### Data Fetching
- All API calls **must** go through the Service Layer.
- **Never fetch directly inside a component.**

---

## Database Schema (Reference)

| Table | Columns | Notes |
|-------|---------|-------|
| `Users` | `id` (uuid), `email` (string), `role` (enum) | Primary user entity |
| `Projects` | `id`, `owner_id` (fk), `status` | Linked to Users |

### Relationships
- A **User** has many **Projects**.

---

## Critical Constraints

### Authentication
- All routes under `/app` must be protected by the `AuthGuard`.

### Performance
- **Lazy load all feature routes.**

---

## When to Use This Skill

Use this skill when:

1. **The user asks "How does data get from X to Y?"**
   - Trace the flow: Component → Hook → Service → API → Store

2. **When creating a new feature module**
   - Follow the directory structure
   - Ensure proper separation of concerns
   - Wire up to global store correctly

3. **When debugging state synchronization issues**
   - Check if data is being mutated directly
   - Verify service layer is being used
   - Confirm AuthGuard is in place for protected routes

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    /src/components (Presentational)             │
│                    - Receives props                             │
│                    - Emits events via callbacks                 │
│                    - NO business logic                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    /src/features (Smart Components)             │
│                    - Connects to store                          │
│                    - Dispatches actions                         │
│                    - Orchestrates data flow                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    /src/hooks (Custom Hooks)                    │
│                    - Encapsulates reusable logic                │
│                    - Abstracts service calls                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    /src/services (API Layer)                    │
│                    - All external API calls                     │
│                    - Error handling                             │
│                    - Data transformation                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    /src/store (Global State)                    │
│                    - Single source of truth                     │
│                    - Redux/Context slices                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Commands

### Creating a New Feature Module

1. Create feature directory: `/src/features/[feature-name]/`
2. Add slice: `/src/features/[feature-name]/[feature-name]Slice.ts`
3. Add service: `/src/services/[feature-name]Service.ts`
4. Add components: `/src/features/[feature-name]/components/`
5. Register in store: Update `/src/store/index.ts`

### Debugging Checklist

- [ ] Is the component using the service layer (not direct fetch)?
- [ ] Is state being updated immutably?
- [ ] Is the route protected by AuthGuard?
- [ ] Is the feature route lazy loaded?
- [ ] Is the store slice registered correctly?
