# TEST_STRATEGY — agentboard-web

## Scope

Unit tests for React components, custom hooks, and the board state reducer. All network
interaction and WebSocket communication is mocked in tests.

## Test Layers

| Layer | Location | Tooling | Scope |
|-------|----------|---------|-------|
| Unit | `src/test/unit/components/` | Vitest + Testing Library + jsdom | Component rendering, user interactions, conditional UI |
| Unit | `src/test/unit/hooks/` | Vitest + jsdom | Hook state transitions, side effects, mock service integration |

## Key Test Subjects

### `boardReducer` (`src/store/boardReducer.ts`)
Tested for every action type including all 8 WebSocket event types:
`INIT_BOARD`, `ADD_CARD`, `UPDATE_CARD`, `DELETE_CARD`, `MOVE_CARD`,
`TASKS_CREATED`, `TASK_UPDATED`, `ARTIFACT_ADDED`, `COMMAND_EXECUTION_UPDATED`

### `useWebSocket` hook (`src/hooks/useWebSocket.ts`)
- Tested with a mock `@stomp/stompjs` Client
- Asserts subscription to `/topic/tenant/{tenantId}/board-events`
- Asserts `boardReducer` dispatch is called for each incoming event type
- Asserts reconnect triggers `INIT_BOARD` full sync via `GET /api/boards/current`

### `useAuth` hook (`src/hooks/useAuth.ts`)
- Login/logout/register state transitions
- JWT storage and retrieval from localStorage
- Axios mock responses for success and error cases

### Components
- `FeatureCard`: renders title, reExecutionPending badge, task progress indicator
- `CardModal`: title editing, description editing, tab navigation, delete/save
- `Board`: drag-end simulation, column transitions, API call assertions

## Mocked Services

- API calls mocked via Axios mock adapters or MSW (Mock Service Worker)
- `@stomp/stompjs` Client mocked in `useWebSocket` tests
- No Pact involvement — web consumes board-service APIs directly

## What Is NOT Tested Here

- Full user flows (covered by `agentboard-e2e`)
- API contract correctness (covered by `agentboard-api-tests`)

## Running Tests

```bash
npm test        # Vitest unit tests
npm run lint    # ESLint
npm run build   # TypeScript type-check + Vite build
```

## Notes

- SWR polling interval must be ≤ 3s per MVP constraints (used only for auth, not board state)
- Board state is driven by WebSocket events via `boardReducer`; REST is used only for initial
  load and reconnect sync
