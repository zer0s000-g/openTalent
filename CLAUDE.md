# Project: Talent Graph Platform

## Objective
Build a V1 internal talent graph platform inspired by enterprise talent marketplace products.

The V1 scope is intentionally limited to:
1. Create a workforce knowledge graph of employees and talent attributes
2. Provide a dashboard to visualize the graph and workforce summaries
3. Support a clean and usable UI/UX for up to 5000 employees

## Product definition
The platform is not a full talent marketplace yet.
It is a talent intelligence and graph exploration system.

Core objects:
- Employees
- Skills
- Certifications
- Education
- Roles
- Departments
- Aspirations
- Reporting relationships

Core user journeys:
- Search for an employee
- Explore their graph neighborhood
- Filter by department, role, skill, certification, location, aspiration
- View dashboard summaries
- Import and update employee data from CSV

## Non-goals for V1
Do not build:
- Internal job marketplace
- AI talent matching recommendations
- Learning recommendations
- Career path engine
- Workforce forecasting
- Resume parsing AI
- Full HRIS replacement

## Technical stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Neo4j
- GraphQL via @neo4j/graphql
- Sigma.js for graph rendering
- Zod for input validation
- React Query or server-side data fetching as appropriate

## Architecture principles
- Graph database is the source of truth for relationships
- Never render the entire company graph by default
- Every graph view must be bounded, filtered, clustered, or ego-centric
- Keep API responses lean and frontend-friendly
- Prefer composable components over page-specific logic
- Use strict typing throughout
- Prefer production-oriented structure over quick hacks

## UI principles
- White base background
- One strong blue accent color
- Minimal enterprise aesthetic
- Clear visual hierarchy
- Readability first
- Avoid clutter and unnecessary controls
- Left filter rail, center graph canvas, right detail panel for graph pages
- Dashboard should be scannable in under 10 seconds

## Data rules
- Normalize skill, certification, education, and aspiration names
- Deduplicate canonical entities
- Support employee upserts
- Keep manager relationships stable via employee_id / manager_id
- Treat imported data as messy and validate aggressively

## Performance rules
- Do not fetch unbounded graph neighborhoods
- Do not show all node labels at once
- Use limits for neighbors and edges
- Add pagination to list views
- Prefer progressive disclosure
- Use graph clustering and category toggles
- Optimize for 5000 employee scale

## Required app pages
- Dashboard
- Graph Explorer
- Employee Profile
- Skills / Intelligence Page
- Import / Admin Page

## Commands
- install: npm install
- dev: npm run dev
- build: npm run build
- lint: npm run lint
- test: npm run test
- typecheck: npm run typecheck

## Code quality rules
- Use strict TypeScript
- No any unless unavoidable and justified
- Use shared types for graph nodes and edges
- Keep components small and reusable
- Separate UI components from data access concerns
- Validate all import payloads with Zod
- Add loading, empty, and error states to all major views
- Avoid placeholder mock data in production code paths

## Backend rules
- Use Neo4j GraphQL where suitable
- Add custom resolvers only where graph shape or performance requires it
- Bound all graph queries
- Return graph data in node/edge format suitable for visualization
- Ensure import pipeline is idempotent where possible

## Testing priorities
- CSV validation and normalization
- Upsert correctness
- Relationship creation correctness
- Graph query response shape
- Search and filter behavior
- Dashboard summary queries
- Employee profile rendering
- Graph interactions for selection and detail panel state

## Workflow expectations
Before coding:
1. Read this file
2. Inspect the repo
3. Produce a phased implementation plan
4. Identify risks and assumptions

During coding:
1. Work in small coherent steps
2. Run typecheck after meaningful changes
3. Run tests where relevant
4. Summarize what changed and any open issues

## Decision heuristics
When in doubt:
- choose simplicity over cleverness
- choose bounded graph exploration over “show everything”
- choose maintainability over novelty
- choose clarity over visual spectacle

OpenTalent/
  .claude/
    agents/
      graph-architect.md
      data-ingestion.md
      frontend-ux.md
      performance-auditor.md
      qa-reviewer.md
  app/
    dashboard/
      page.tsx
    graph/
      page.tsx
    employee/
      [id]/
        page.tsx
    skills/
      page.tsx
    admin/
      import/
        page.tsx
    api/
      graphql/
        route.ts
  components/
    dashboard/
    graph/
    employee/
    filters/
    shared/
  lib/
    neo4j.ts
    graphql.ts
    graph-formatters.ts
    normalization.ts
    validation.ts
  graphql/
    schema.graphql
    queries.ts
  scripts/
    seed.ts
    import-employees.ts
  tests/
  public/
  CLAUDE.md
  package.json
  tsconfig.json
  .env.local