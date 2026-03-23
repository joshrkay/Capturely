# Story G.1: Templates Gallery Page

Status: ready-for-dev

## Story

As a merchant,
I want to browse a gallery of pre-built form templates,
so that I can quickly start a campaign without designing a form from scratch.

## Acceptance Criteria

1. Templates page is accessible from the main navigation at `/app/templates`
2. Templates are displayed as preview cards with thumbnail, name, category, and description
3. Templates are filterable by category (e-commerce, lead gen, newsletter, feedback, exit intent)
4. Merchant can preview a template before using it
5. "Use Template" action creates a new campaign pre-populated with the template's fields, styles, and settings
6. At least 6 starter templates are seeded for launch
7. Templates are stored as JSON definitions (not DB records initially — can be static)

## Tasks / Subtasks

- [ ] Define `Template` type in `src/lib/templates.ts` (name, category, description, thumbnail, FormSchema, FormStyle) (AC: 7)
- [ ] Create 6+ starter template definitions as static data (AC: 6)
  - [ ] Newsletter signup (email + name)
  - [ ] Exit intent discount popup (email + coupon display)
  - [ ] Product feedback form (rating + textarea)
  - [ ] Lead generation (name + email + phone + company)
  - [ ] Cart abandonment popup (email + incentive)
  - [ ] Contact form (name + email + subject + message)
- [ ] Create `src/app/app/templates/page.tsx` server component (AC: 1)
  - [ ] Template card grid layout with thumbnails (AC: 2)
  - [ ] Category filter tabs/buttons (AC: 3)
  - [ ] Preview modal/drawer (AC: 4)
- [ ] "Use Template" flow → POST to create campaign with template data (AC: 5)
- [ ] Add "Templates" link to dashboard navigation (AC: 1)

## Dev Notes

- Reference Figma: `pages/templates.tsx`
- Start with static templates (JSON files or inline data). Can move to DB later for user-created templates.
- "Use Template" should redirect to the campaign builder with pre-filled data
- Template thumbnails can be static images or CSS-rendered previews
- Consider reusing the form preview component (Story F.4) for template previews

### Project Structure Notes

- New files: `src/app/app/templates/page.tsx`, `src/lib/templates.ts`
- Touches: `src/app/app/layout.tsx` (add nav link)

### References

- [Source: Figma Make — pages/templates.tsx]
- [Source: docs/PRD.md#Gate F — Template Library]
- [Source: docs/BUILT-FEATURES.md#Templates Gallery]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
