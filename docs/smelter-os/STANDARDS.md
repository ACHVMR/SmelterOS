# ENGINEERING STANDARDS & CONSTRAINTS

## 1. INFRASTRUCTURE & ARCHITECTURE
- **Platform**: Google Cloud Platform (GCP).
- **Compute**: Cloud Run (Stateless Containers).
- **Database**: Firebase Firestore (NoSQL) for app state, users, and refined data.
- **Storage**: Firebase Storage (Artifacts, Assets).
- **Communication**: REST API / gRPC. No direct DB access from Client except via Firebase SDK (strictly controlled by Security Rules).

## 2. FRONTEND (The Console)
- **Framework**: Next.js (App Router).
- **Styling**: Tailwind CSS.
- **Components**: Shadcn/UI (Radix Primitives) + Lucide React.
- **State Management**: React Query (Server State) + Zustand (Client State).
- **Strict Rule**: **No heavy agent logic in the Next.js runtime.** The Frontend is a "View Layer" only. It sends commands to the Backend/Agents and renders streams/results.
- **Aesthetic**: "High-Fidelity Matrix" / "Terminal Green".
- **Typography**: `JetBrains Mono` (Code/Data), `Inter` (UI).

## 3. BACKEND (The Foundry)
- **Runtime**: Python (FastAPI/LiteLLM) or Node.js (Express/Hono) depending on specific microservice.
- **Agent Runtimes**: Must be isolated in separate Cloud Run services or specialized workers.
- **API Contract**: OpenAPI (Swagger) v3.

## 4. CODING CONVENTIONS
- **Types**: Strict TypeScript for all Frontend code. Pydantic models for all Python Backend code.
- **Linting**: ESLint (Next.js config) + Prettier.
- **Testing**:
  - Frontend: Vitest + React Testing Library.
  - Backend: Pytest.
- **File Naming**: `kebab-case` for files/folders. `PascalCase` for Components.

## 5. DEPLOYMENT (CI/CD)
- **Pipeline**: GitHub Actions triggers Cloud Build.
- **Environment**:
  - `main` branch -> Production.
  - `dev` branch -> Preview/Staging.
- **Secrets**: Google Secret Manager (injected at runtime).
