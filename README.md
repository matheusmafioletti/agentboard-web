# agentboard-web

React 18 + Vite 5 + Tailwind CSS 3 frontend for AgentBoard.

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
# Start dev server at http://localhost:5173
npm run dev

# Run tests
npm test

# Lint
npm run lint

# Production build
npm run build
```

## Architecture

- **React Router v6** for client-side routing
- **SWR** for data fetching (polling ≤ 3s)
- **@dnd-kit** for drag-and-drop Kanban board
- **Tailwind CSS** for styling
