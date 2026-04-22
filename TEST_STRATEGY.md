# Test Strategy: agentboard-web

## Layers

| Layer | Location | Tooling | Scope |
|-------|----------|---------|-------|
| Unit | `src/test/unit/` | Vitest + Testing Library + jsdom | Isolated component rendering, hook behavior |

## Mocked Services

- API calls mocked via MSW (Mock Service Worker)
- No Pact involvement — web consumes board-service APIs directly

## What Is NOT Tested Here

- Full user flows (covered by `agentboard-e2e`)
- API contract correctness (covered by `agentboard-api-tests`)

## Running Tests

```bash
npm test
```

## Notes

- SWR polling interval must be ≤ 3s per MVP constraints
- No WebSocket or SSE in MVP scope
