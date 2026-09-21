 Athlite-Dash: Architecture & Engineering Hand-Off
1. Project Overview
Athlite-Dash is a dynamic, highly scalable performance tracking platform for athletes and coaches. The system aggregates weight training, sport-specific skill metrics, and external health API data (e.g., Whoop, Oura). It features an offline-first architecture, role-based access control (RBAC), and a dynamic schema-less data model allowing admins to create new sports and metrics without database migrations.
2. Technology Stack
The application is built in a TypeScript Monorepo (via NPM Workspaces) to enforce strict data contracts between the frontend and backend.
Frontend (PWA-Ready): React 18 (Vite), Tailwind CSS v4, Recharts (Data Visualization), idb (IndexedDB offline engine).
Backend: Node.js, Express.js, TypeScript.
Database & Auth: PostgreSQL (hosted via Supabase), Supabase Auth (JWT).
Design Pattern: Controller-Route-Middleware (Backend), SOLID Principles (Frontend Component Isolation).
3. Database Schema & Dynamic Core
To avoid rigid database structures, the architecture uses a hybrid Relational + JSONB data model. PostgreSQL's GIN indexing ensures lightning-fast queries on the dynamic JSONB columns.
Core Tables
users: Core profile data (id, role, first_name, last_name). Synchronized via database triggers upon Auth signup.
coach_athletes: Junction table establishing the RBAC mapping between coaches and athletes.
sport_templates: Defines the activity (e.g., "Basketball Game", "Daily Health").
metric_definitions: Linked to templates. Defines specific inputs (e.g., points, sleep_score, type: 'number' | 'enum', is_required).
events: The transaction table. Contains the user_id, template_id, recorded_at, and the actual user data stored dynamically inside a payload (JSONB) column.
goals: Tracks specific user goals (target_value, deadline) mapped to a metric_key.
4. API Architecture & Data Contracts
The backend strictly adheres to a modular Controller pattern. Security is enforced via a JWT verification middleware (requireAuth).
Key Endpoints
GET /api/v1/auth/me: Fetches the current user profile & role.
GET /api/v1/coach/athletes: Fetches athletes assigned to a coach.
GET /api/v1/templates: Fetches sport templates & nested metric definitions.
POST /api/v1/events: Ingests new workout/health data. Securely overrides user_id using the verified JWT token.
GET /api/v1/analytics/:templateId: Fetches time-series data. (Supports ?athlete_id=xyz for Coaches, protected by RBAC validation).
GET/POST /api/v1/goals: Fetches or sets goals for specific metrics.
POST /api/v1/webhooks/health: Public-facing endpoint for Oura/Whoop. Protected by a x-webhook-secret header.
5. Key Frontend Systems (React)
5.1. Dynamic Form Generator
The frontend adheres to the Open/Closed Principle. The DynamicForm.tsx component parses the metric_definitions array and automatically renders HTML inputs (number, text, select) based on the database configuration. No React code needs to be updated to add new sports.
5.2. Data Visualization Engine
The ProgressChart.tsx component utilizes Recharts. It automatically scans the active sport template for type: 'number' metrics and plots dynamic lines for historical data. It also leverages <ReferenceLine> to visually map user goals directly onto the chart's Y-Axis.
5.3. Offline-First Sync (IndexedDB)
The platform is resilient to network drops (e.g., inside a gym).
Queueing: If !navigator.onLine, handleWorkoutSubmit writes the payload to a local IndexedDB store (idb).
Background Sync: A global event listener (window.addEventListener('online')) detects network restoration, silently flushes the IndexedDB queue chronologically to the Express backend, and triggers a UI graph redraw.
5.4. UX Theming Engine
The application utilizes a CSS-variable theming engine tied to the HTML color-scheme and data-theme attributes. Switching themes (e.g., Light, Dark, Ocean Blue) instantly recalculates Tailwind backgrounds, form inputs, native calendar popups, and Recharts stroke colors without a page reload.
6. Security & Compliance Requirements
6.1. Role-Based Access Control (RBAC)
Team vs. Personal View: Coaches can toggle between Team View and Personal View.
Backend Security: If a Coach requests an athlete's data, the backend queries the coach_athletes table to verify authorization before returning rows.
6.2. Date & Timezone Integrity
Timestamp Normalization: All frontend timestamps are normalized using T12:00:00Z to anchor local dates securely to UTC midday, preventing timezone-shift bugs on graphs.
Future-State Prevention: The backend actively blocks any event submissions where recorded_at > Date.now() to prevent malicious future-state data pollution.
6.3. API Keys & Database Security
Frontend: Uses the Supabase ANON_KEY. Subject to PostgreSQL Row Level Security (RLS).
Backend: Uses the Supabase SERVICE_ROLE_KEY. Safely stored in backend .env files (excluded via .gitignore).
Third-Party Webhooks: Secured via a strict WEBHOOK_SECRET header validation.
7. Next Steps for the Development Team (Production Prep)
Pagination: Implement pagination on the /api/v1/analytics route to cap JSON payloads as athletes accumulate years of data.
Webhook Normalization: Expand the webhooks.ts controller to parse distinct payload shapes from Oura vs. Whoop vs. Apple Health.
CI/CD Pipeline: Configure GitHub Actions for automated TypeScript type-checking and automated deployments to Vercel (Frontend) and Render/AWS (Backend).
React Native Migration: Because the business logic is isolated in hooks and utility files, the React codebase is primed to be ported to React Native (Expo) when the mobile application phase begins.
