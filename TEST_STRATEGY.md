# TEST_STRATEGY.md — agentboard-web

## Owned automated tests

| Area | Location | Notes |
|------|----------|--------|
| MarkdownField (sanitize, split, preview-only, fullscreen toggle) | `src/components/shared/__tests__/MarkdownField.test.tsx` | Vitest + Testing Library |

## Manual regressions (Markdown descriptions)

1. Create work item: type `**bold**` and a list; confirm preview updates before save; fullscreen on/off without losing text; save and reopen from board card.
2. Card detail: open item → read-only preview equals editor preview; Edit description → split panes → save → read-only updates.
3. Paste untrusted HTML/script fragments; confirm source text is kept in editor but preview does not execute scripts.
4. Non-ASCII and punctuation (`*_[]`, accented characters) survive save → GET round-trip (covered in `WorkItemControllerIT#patchWorkItem_preservesMarkdownDescriptionRoundTripThroughGetDetail`).
5. Kanban: drag still works from the grip icon; title click opens detail modal.

## Out of scope today

- Dashboard / list views do not render work item bodies; no change required until those surfaces show `description`.

## Feature 009 notes

| Risk | Coverage |
|------|----------|
| `displayKey` format change breaking card display | All test fixtures migrated to `F1`/`U2`/`T3` style; `WorkItemCard.test.tsx` asserts `F1` renders |
| Children section not collapsed by default | `WorkItemCard.test.tsx` asserts children hidden on load, toggle expands/collapses |
| Type color regression (Feature purple, US green, Task amber) | `workItemTypeTokens.ts` updated; manual pass on board in light+dark mode |
| Left border stripe missing on card | `WorkItemCard.tsx` applies `border-l-4 + WORK_ITEM_TYPE_BORDER`; visual regression manual |
| ProjectDetailPage still shows fullscreen toggle or preview in edit mode | `ProjectDetailPage.test.tsx` asserts `markdown-fullscreen-enter` and `markdown-preview-pane` absent during edit |
| ProjectDetailPage narrow `max-w-3xl` layout persists | Removed from component; page uses `flex-1 min-w-0` |

## Feature 008 — type badges, hierarchy, Items tree

| Risk | Coverage |
|------|----------|
| Board cards missing `displayKey` / broken layout with expand + child-board navigation | Vitest `WorkItemCard`; manual Kanban FEATURE→US→TASK chain |
| `includeParent=false` regressions exploding list payloads | API default false; board SWR passes `includeParent` only for US/TASK filtered views |
| Items page tree vs flat diverge | Vitest `ItemsListView`; Playwright smoke `tests/items/work-items-navigation.spec.ts` |
| Dark-mode contrast on violet/amber badges | Manual pass on `WorkItemTypeBadge` surfaces + Card modal |

