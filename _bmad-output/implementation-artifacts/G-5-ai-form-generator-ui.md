# Story G.5: AI Form Generator Chat UI

Status: ready-for-dev

## Story

As a merchant,
I want a chat-based AI form generator,
so that I can describe what I need in natural language and get a ready-to-use form.

## Acceptance Criteria

1. AI Form Generator is accessible from the campaign creation flow and the builder sidebar
2. Chat-style interface with message bubbles (user prompts + AI responses) with timestamps
3. Starter prompt chips shown for first-time users: "Newsletter signup for fashion store", "Exit intent discount popup", "Contact form for agency"
4. AI generates a complete FormSchema with fields, styles, and suggested settings
5. Generated form is shown as a live side-by-side FormPreview (reuse F.4's extracted component)
6. Merchant can iterate ("make it shorter", "add a phone field") — sends previous schema + new prompt
7. "Use This Form" action creates a campaign with the generated schema
8. AI generation respects plan limits (tracked via `AccountUsage.aiGenerationsCount`)
9. Loading state shown during generation with animated indicator
10. Works in two contexts: builder panel (with `onApplySchema` callback) and standalone (in `/app/campaigns/new/` flow)

## Dependencies

| Direction | Story | Description |
|-----------|-------|-------------|
| BLOCKED BY | F.4 | FormPreview component must exist for side-by-side preview |
| BLOCKS | Nothing | |

## Tasks / Subtasks

### Task 1: Extract existing AiCopilotPanel into standalone component (AC: 1, 10)

- [ ] Create `src/app/app/campaigns/components/ai-chat-panel.tsx` as a `"use client"` component
- [ ] Extract the existing `AiCopilotPanel` function (lines 371-465 of `src/app/app/campaigns/[id]/builder/page.tsx`) into the new file
- [ ] Preserve existing functionality: prompt input, loading boolean, error string, history array, POST to `/api/ai/generate`, JSON parsing with markdown code block handling
- [ ] Update the builder page to import from the new component file
- [ ] Verify existing behavior is preserved after extraction (no visual regression)

### Task 2: Define enhanced component interfaces (AC: 2, 5, 10)

- [ ] Define the extended props interface supporting both usage contexts:
  ```ts
  interface AiChatMessage {
    id: string;            // crypto.randomUUID()
    role: "user" | "assistant";
    content: string;       // user prompt or AI response text
    schema?: FormSchema;   // parsed schema when AI returns valid JSON
    timestamp: Date;
    error?: string;        // parse error if schema was invalid
  }

  interface AiChatPanelProps {
    campaignType: string;
    onApplySchema: (schema: FormSchema) => void;
    currentSchema?: FormSchema;  // for iterative refinement in builder
    standalone?: boolean;        // true when used in /campaigns/new/ flow
  }
  ```
- [ ] Export `AiChatMessage` type for use by parent components

### Task 3: Build chat message UI (AC: 2, 3, 9)

- [ ] Replace flat history list with scrollable message bubble layout
  - User messages: right-aligned, `bg-indigo-600 text-white` rounded bubble
  - AI messages: left-aligned, `bg-zinc-100 dark:bg-zinc-800` rounded bubble
  - Each bubble shows relative timestamp (`formatDistanceToNow` or simple "just now" / "2m ago")
  - Auto-scroll to bottom on new message using `useRef` + `scrollIntoView`
- [ ] Implement starter prompt chips displayed when `messages` array is empty:
  ```ts
  const STARTER_PROMPTS = [
    "Newsletter signup for fashion store",
    "Exit intent discount popup",
    "Contact form for agency",
    "Product feedback survey",
    "Lead capture for SaaS landing page",
  ];
  ```
  - Render as clickable pill buttons: `rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300`
  - Clicking a chip populates the prompt input and auto-submits
- [ ] Loading indicator: animated three-dot bounce in an assistant message bubble while waiting for response
- [ ] Error messages: inline red banner below the failed message bubble, with "Retry" button

### Task 4: Implement iterative refinement (AC: 6)

- [ ] Track `currentSchema` in component state (updated after each successful generation)
- [ ] When `currentSchema` exists, include it in the API request body:
  ```ts
  body: JSON.stringify({
    prompt,
    campaignType,
    existingSchema: currentSchema,  // passed to AI for context
  })
  ```
- [ ] Route selection logic based on prompt intent:
  - Default: `POST /api/ai/generate` with `{ prompt, campaignType, existingSchema? }`
  - Copy-focused prompts (detected by keywords "copy", "text", "heading", "wording"): `POST /api/ai/generate-copy`
  - Field-focused prompts ("add field", "remove field", "field for"): `POST /api/ai/suggest-fields`
  - Style-focused prompts ("color", "font", "style", "theme", "dark mode"): `POST /api/ai/suggest-style`
- [ ] Each AI response that includes a valid schema updates `currentSchema` state
- [ ] Assistant message bubble shows "Schema applied" badge when schema was successfully parsed

### Task 5: Side-by-side FormPreview integration (AC: 5)

- [ ] Import `FormPreview` from `src/app/app/campaigns/[id]/builder/components/form-preview.tsx`
- [ ] Layout: flex row with chat panel (left, `flex-1`) and preview panel (right, `w-[400px]`)
  - On screens < `lg` breakpoint: stack vertically with preview above chat
  - Preview panel has sticky positioning (`sticky top-4`) so it stays visible while scrolling chat
- [ ] Preview panel renders the latest `currentSchema` via `<FormPreview schema={currentSchema} campaignType={campaignType} />`
- [ ] When no schema exists yet, show placeholder: "Generate a form to see a preview" with an illustration/icon
- [ ] Preview updates live as each new schema is parsed from AI responses
- [ ] Viewport toggle (desktop/tablet/mobile) reused from F.4's preview component

### Task 6: Plan limit enforcement (AC: 8)

- [ ] Before each API call, fetch usage status from `GET /api/billing/status`
  - Cache the response in component state; refresh every 5 minutes or after each generation
- [ ] Plan limits from `src/lib/plans.ts`:
  - FREE: `aiGenerationsPerMonth = 0` (AI not available)
  - STARTER: `aiGenerationsPerMonth = 0` (AI not available)
  - GROWTH: `aiGenerationsPerMonth = 500`
  - ENTERPRISE: `aiGenerationsPerMonth = Infinity`
- [ ] When plan does not include AI (`aiGenerationsPerMonth === 0`):
  - Show upgrade CTA instead of chat: "AI Form Generator is available on Growth plan and above"
  - Link to `/app/billing` with `rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white` button
- [ ] When limit is reached (`aiGenerationsCount >= aiGenerationsPerMonth`):
  - Disable send button, show "AI generation limit reached for this billing cycle"
  - Show current count vs limit: "480/500 generations used"
- [ ] Handle 402 and 403 API responses gracefully with specific error messages in the chat

### Task 7: "Use This Form" action (AC: 7)

- [ ] Render "Use This Form" button below the preview panel when a valid schema exists:
  - `rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50`
- [ ] Builder panel context (`standalone === false`):
  - Calls `onApplySchema(currentSchema)` — parent builder page handles the rest
  - Button label: "Apply to Campaign"
- [ ] Standalone context (`standalone === true`):
  - POSTs to `/api/campaigns` with `{ name: "AI Generated Form", siteId, schema: currentSchema }`
  - Requires site selection (dropdown if merchant has multiple sites)
  - On success: redirect to `/app/campaigns/[newCampaignId]/builder`
  - On error: show inline error message
- [ ] Loading state on button during API call

### Task 8: Integrate into campaign creation flow (AC: 1, 10)

- [ ] Modify `src/app/app/campaigns/new/page.tsx`:
  - Add "AI Generator" as a tab/option alongside existing creation methods
  - When selected, render `<AiChatPanel standalone campaignType={selectedType} onApplySchema={...} />`
- [ ] Modify builder page (`src/app/app/campaigns/[id]/builder/page.tsx`):
  - Replace inline `AiCopilotPanel` with imported `<AiChatPanel>` component
  - Pass `currentSchema` from builder state for iterative refinement context
  - `onApplySchema` callback updates the builder's form state

## Dev Notes

### CRITICAL: Extract, Do Not Rewrite

The existing `AiCopilotPanel` (lines 371-465 of `src/app/app/campaigns/[id]/builder/page.tsx`) contains working logic for:
- POST to `/api/ai/generate` with `{ prompt, campaignType }`
- JSON parsing that handles markdown code block wrapping (`/```(?:json)?\s*([\s\S]*?)```/`)
- History tracking as `Array<{ prompt: string; response: string }>`
- Error handling for invalid schemas

Extract this first, then enhance. Do NOT rewrite from scratch.

### Current Props vs Enhanced Props

Current (lines 373-376):
```ts
{ campaignType: string; onApplySchema: (schema: FormSchema) => void }
```

Enhanced:
```ts
{
  campaignType: string;
  onApplySchema: (schema: FormSchema) => void;
  currentSchema?: FormSchema;   // enables iterative refinement
  standalone?: boolean;         // controls "Use This Form" behavior
}
```

### AI API Endpoints (All Exist)

| Endpoint | Purpose | Input |
|----------|---------|-------|
| `POST /api/ai/generate` | Full form schema generation | `{ prompt, campaignType, industry?, siteUrl? }` |
| `POST /api/ai/generate-copy` | Copy/text refinement | `{ prompt, existingSchema }` |
| `POST /api/ai/suggest-fields` | Field additions/modifications | `{ prompt, existingFields }` |
| `POST /api/ai/suggest-style` | Style/theme changes | `{ prompt, existingStyle }` |

All endpoints enforce auth via `withAccountContext()`, RBAC via `canManageCampaigns()`, plan check via `resolvePlan()`, and usage tracking via `AccountUsage.aiGenerationsCount` increment.

### Chat History

Maintained entirely in client state as `AiChatMessage[]`. Not persisted to DB. The `AiGenerationLog` table on the server already logs each generation for audit purposes.

### Design System

Follow the established Capturely design system:
- Page background: `bg-zinc-50 dark:bg-black`
- Card borders: `border border-zinc-200 dark:border-zinc-800`
- Card background: `bg-white dark:bg-zinc-900`
- User bubbles: `bg-indigo-600 text-white rounded-2xl rounded-br-sm px-3 py-2`
- AI bubbles: `bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl rounded-bl-sm px-3 py-2`
- Input: `rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100`
- Primary buttons: `rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50`
- Starter chips: `rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700`

### Project Structure Notes

- New files:
  - `src/app/app/campaigns/components/ai-chat-panel.tsx`
- Modified files:
  - `src/app/app/campaigns/[id]/builder/page.tsx` (remove inline AiCopilotPanel, import new component)
  - `src/app/app/campaigns/new/page.tsx` (add AI Generator tab)
- Existing files used (NOT modified):
  - `src/app/app/campaigns/[id]/builder/components/form-preview.tsx` (reused for preview, from F.4)
  - `src/app/api/ai/generate/route.ts`
  - `src/app/api/ai/generate-copy/route.ts`
  - `src/app/api/ai/suggest-fields/route.ts`
  - `src/app/api/ai/suggest-style/route.ts`
  - `src/app/api/billing/status/route.ts` (usage check)

### References

- [Source: src/app/app/campaigns/[id]/builder/page.tsx — lines 371-465, existing AiCopilotPanel]
- [Source: src/app/api/ai/generate/route.ts — generate endpoint with plan/usage checks]
- [Source: src/app/api/ai/generate-copy/route.ts — copy refinement endpoint]
- [Source: src/app/api/ai/suggest-fields/route.ts — field suggestion endpoint]
- [Source: src/app/api/ai/suggest-style/route.ts — style suggestion endpoint]
- [Source: src/lib/plans.ts — aiGenerationsPerMonth: FREE=0, STARTER=0, GROWTH=500, ENTERPRISE=Infinity]
- [Source: prisma/schema.prisma — AccountUsage.aiGenerationsCount field]
- [Source: src/app/app/campaigns/[id]/builder/components/form-preview.tsx — FormPreview from F.4]
- [Source: src/app/app/campaigns/new/page.tsx — campaign creation flow]

## Testing Notes

- Verify extraction: builder page still works with the new imported component (no regression)
- Verify starter chips appear when chat is empty and disappear after first message
- Verify clicking a starter chip auto-submits the prompt
- Verify message bubbles render correctly: user on right, AI on left, timestamps visible
- Verify auto-scroll to latest message when new messages arrive
- Verify iterative refinement: second prompt includes previous schema in request
- Verify route selection: style prompts hit `/api/ai/suggest-style`, field prompts hit `/api/ai/suggest-fields`
- Verify FormPreview updates live when AI returns a new schema
- Verify "Use This Form" in builder mode calls `onApplySchema` callback
- Verify "Use This Form" in standalone mode creates campaign via POST `/api/campaigns` and redirects
- Verify plan gate: FREE/STARTER users see upgrade CTA, not the chat
- Verify usage limit: disabled state when `aiGenerationsCount >= aiGenerationsPerMonth`
- Verify 402 response from API shows "limit reached" message in chat
- Verify 403 response from API shows "plan required" message in chat
- Verify loading state: three-dot animation in assistant bubble during generation
- Verify error handling: invalid schema shows "AI returned an invalid schema" with retry option
- Verify responsive layout: side-by-side on lg+, stacked on smaller screens
- Verify dark mode: all bubbles, chips, and panels render correctly

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
