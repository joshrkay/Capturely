# Story G.5: AI Form Generator Chat UI

Status: ready-for-dev

## Story

As a merchant,
I want a chat-based AI form generator,
so that I can describe what I need in natural language and get a ready-to-use form.

## Acceptance Criteria

1. AI Form Generator is accessible from the campaign creation flow and/or builder
2. Chat-style interface with message history (user prompts + AI responses)
3. Prompt suggestions/starters are shown for first-time users (e.g., "Newsletter signup for fashion store")
4. AI generates a complete FormSchema with fields, styles, and suggested settings
5. Generated form is shown as a live preview alongside the chat
6. Merchant can iterate ("make it shorter", "add a phone field", "change colors to match my brand")
7. "Use This Form" action creates a campaign with the generated schema
8. AI generation respects plan limits (tracked in AccountUsage)
9. Loading state shown during generation

## Tasks / Subtasks

- [ ] Create `src/app/app/campaigns/new/ai-generator.tsx` client component (AC: 1)
  - [ ] Chat message list (user + assistant messages) (AC: 2)
  - [ ] Prompt input with send button (AC: 2)
  - [ ] Starter prompt chips/buttons (AC: 3)
  - [ ] Loading/streaming indicator (AC: 9)
- [ ] Create form preview panel alongside chat (AC: 5)
  - [ ] Render generated FormSchema as live preview
  - [ ] Update preview on each AI response
- [ ] Wire to existing AI generation APIs (AC: 4)
  - [ ] `POST /api/ai/generate` for initial form generation
  - [ ] `POST /api/ai/generate-copy` for copy refinement
  - [ ] `POST /api/ai/suggest-fields` for field suggestions
  - [ ] `POST /api/ai/suggest-style` for style suggestions
- [ ] Support iterative refinement (send previous schema + new prompt) (AC: 6)
- [ ] "Use This Form" → create campaign with generated data (AC: 7)
- [ ] Check AI usage limits before generation (AC: 8)

## Dev Notes

- Reference Figma: `components/ai-form-generator.tsx`
- AI API endpoints already exist (`/api/ai/generate`, `/api/ai/generate-copy`, `/api/ai/suggest-fields`, `/api/ai/suggest-style`)
- The backend uses Claude for generation — ensure prompts produce valid FormSchema JSON
- Chat history should be maintained in client state (not persisted to DB)
- Plan limits for AI generations are in `AccountUsage` — check before each call
- Consider streaming responses for better UX (if AI endpoint supports it)

### Project Structure Notes

- New file: `src/app/app/campaigns/new/ai-generator.tsx`
- Touches: `src/app/app/campaigns/new/page.tsx` (add AI tab/option)

### References

- [Source: src/app/api/ai/generate/route.ts]
- [Source: src/app/api/ai/suggest-fields/route.ts]
- [Source: src/app/api/ai/suggest-style/route.ts]
- [Source: Figma Make — components/ai-form-generator.tsx]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
