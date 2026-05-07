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
