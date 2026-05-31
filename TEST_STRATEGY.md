# agentboard-web — Test Strategy (Feature 010)

## Layers

| Layer | Scope | Tooling |
|-------|--------|---------|
| Unit | `TenantPicker`, `AdminRoute`, `SwitchWorkspaceModal`, `CreateInviteModal`, invite wizard | Vitest, Testing Library, jsdom, MSW |
| E2E | Multitenant login, invite flows, workspace switch | Playwright (`agentboard-e2e`) |

## Key test files

- `src/test/unit/components/auth/TenantPicker.test.tsx`
- `src/test/unit/components/auth/SwitchWorkspaceModal.test.tsx`
- `src/hooks/useAuth.test.ts`

## Run commands

```bash
cd repos/agentboard-web
npm test
npm run lint
```

Auth API calls are mocked via `vi.mock` on `../services/authApi` or MSW handlers in component tests.

## New flows covered

- Admin **Novo convite** modal (generate link + copy)
- Public `/invite/:token` wizard (identify → register/login steps → accept)
- Profile **Trocar workspace** modal (`listMyMemberships`, `switchTenant`, `createTenant`)
