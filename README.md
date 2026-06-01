# agentboard-web

React 18 + Vite 5 + Tailwind CSS 3 frontend for AgentBoard.

![CI](https://github.com/agentboard/agentboard-web/actions/workflows/ci.yml/badge.svg)

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20 LTS |
| npm | 10+ |

## Setup

```bash
npm install
```

## Development

```bash
# Start dev server at http://localhost:3010
npm run dev

# Run tests
npm test

# Lint
npm run lint

# Production build
npm run build
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_AUTH_SERVICE_URL` | `http://localhost:8080` | Auth API base URL |
| `VITE_BOARD_SERVICE_URL` | `http://localhost:8081` | Board API + WebSocket base URL |

In the demo environment both point to the same public origin (nginx routes `/auth` and `/api/v1`).

## Docker

```bash
docker build \
  --build-arg VITE_AUTH_SERVICE_URL=https://agentboard.matheusmafioletti.com \
  --build-arg VITE_BOARD_SERVICE_URL=https://agentboard.matheusmafioletti.com \
  -t agentboard-web:local .
```

Image published to GHCR on push to `main`: `ghcr.io/agentboard/agentboard-web`.

## Deploy (demo VPS)

Requires GitHub Secret `INFRA_DEPLOY_PAT` and variable `DEMO_PUBLIC_URL` (`https://agentboard.matheusmafioletti.com`).

## Architecture

- **React Router v6** for client-side routing
- **SWR** for data fetching (polling ≤ 3s)
- **@dnd-kit** for drag-and-drop Kanban board
- **Tailwind CSS** for styling
