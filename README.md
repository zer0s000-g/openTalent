# OpenTalent - Internal Talent Graph Platform

A V1 internal talent graph platform for workforce intelligence and exploration.

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose (for Neo4j)

### 1. Start Neo4j

```bash
docker-compose up -d
```

Wait ~30 seconds for Neo4j to start. Verify at http://localhost:7474
- Username: `neo4j`
- Password: `opentalent123`

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

The default values work with the Docker Compose setup. `NEO4J_PASSWORD` must match your Neo4j instance.

### 4. Seed Sample Data

```bash
npm run seed
```

This creates 120 sample employees with skills, certifications, education, and manager relationships.

### 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000


## Environment Variables

Create `.env.local` from `.env.example` and set:

- `NEO4J_URI` - Bolt connection string (default `bolt://localhost:7687`)
- `NEO4J_USERNAME` - Neo4j username
- `NEO4J_PASSWORD` - Neo4j password
- `NEO4J_DATABASE` - database name (`neo4j` by default)

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run tests |
| `npm run seed` | Seed database with sample data |
| `npm run import:sample` | Import the sample CSV file |

## Pages

- **Dashboard** (`/dashboard`) - Workforce overview and metrics
- **Graph Explorer** (`/graph`) - Visualize employee networks
- **Skills** (`/skills`) - Browse skills and find employees
- **Admin Import** (`/admin/import`) - Upload CSV files

## Sample Credentials

After seeding, use these employee IDs to explore:

- `EMP0001` - Susan Chen, VP Engineering (executive, no manager)
- `EMP0011` - Sarah Johnson, VP Product
- `EMP0002` - Michael Rodriguez, Engineering Manager
- `EMP0003` - Jennifer Park, Staff Engineer

## CSV Import Format

Required columns:
- `employee_id` - Unique identifier
- `name` - Full name

Optional columns:
- `email`, `title`, `department`, `location`, `hired_date` (YYYY-MM-DD)
- `manager_id` - Employee ID of manager
- `skills` - Semicolon-separated (e.g., "Python;JavaScript;AWS")
- `certifications` - Semicolon-separated
- `education_institution`, `education_degree`, `education_field`
- `aspiration_type`, `aspiration_timeline`

## Architecture

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Backend**: GraphQL via @neo4j/graphql
- **Database**: Neo4j 5.15 with APOC plugin
- **Graph Visualization**: Custom bounded queries for scalable rendering

## Graph Schema

Core entities:
- `Employee` - People in the organization
- `Skill` - Capabilities and technologies
- `Certification` - Professional certifications
- `Education` - Educational background
- `Aspiration` - Career goals and interests
- `Department` - Organizational units

Key relationships:
- `(:Employee)-[:REPORTS_TO]->(:Employee)` - Management hierarchy
- `(:Employee)-[:HAS_SKILL]->(:Skill)` - Skill associations
- `(:Employee)-[:HOLDS_CERTIFICATION]->(:Certification)`
- `(:Employee)-[:HAS_EDUCATION]->(:Education)`
- `(:Employee)-[:ASPIRES_TO]->(:Aspiration)`

## Performance Guidelines

The platform is optimized for organizations with up to 5000 employees:

- Graph queries are bounded (limited depth and node count)
- Default views show ego networks, not the full company graph
- Department and skill subgraphs are limited to 100 employees
- Full-text search indexes enable fast employee lookup

## Troubleshooting

### Neo4j Connection Failed

1. Ensure Docker container is running: `docker ps`
2. Check Neo4j logs: `docker logs opentalent-neo4j`
3. Verify credentials in `.env.local`

### GraphQL Errors

1. Clear `.next` folder: `rm -rf .next`
2. Restart dev server
3. Check Neo4j is accessible at http://localhost:7474

### Seed Script Fails

1. Stop Neo4j: `docker-compose down`
2. Remove volume: `docker volume rm opentalent_neo4j_data`
3. Restart: `docker-compose up -d`
4. Wait 30 seconds, then run seed again

## License

Internal use only.
