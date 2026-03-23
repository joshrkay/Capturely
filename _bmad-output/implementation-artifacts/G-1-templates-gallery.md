# Story G.1: Templates Gallery Page

Status: ready-for-dev

## Story

As a merchant,
I want to browse a gallery of pre-built form templates,
so that I can quickly start a campaign without designing a form from scratch.

## Acceptance Criteria

1. Templates page is accessible from the main navigation at `/app/templates`
2. "Templates" link is added to `navLinks` array in `src/app/app/layout.tsx`
3. Templates are displayed as preview cards with thumbnail, name, category, and description
4. Templates are filterable by category using `getTemplateCategories()` from `src/lib/templates/index.ts`
5. Merchant can preview a template in a modal that reuses the `FormPreview` component from Story F.4
6. "Use Template" action POSTs to `/api/campaigns` with the template's schema data, creating a campaign with a control variant, then redirects to the campaign builder
7. All 10 existing templates render correctly: email-capture, welcome-discount, exit-intent, contact-form, product-feedback, newsletter-signup, pre-launch-waitlist, cart-abandonment, survey-nps, lead-qualification
8. Category filter shows all four categories: "Lead Generation", "E-commerce", "General", "Feedback"
9. "All" filter option shows all templates unfiltered
10. Page follows existing design system (bg-zinc-50 dark:bg-black, border-zinc-200 dark:border-zinc-800)

## Tasks / Subtasks

- [ ] Add "Templates" to `navLinks` in `src/app/app/layout.tsx` (AC: 1, 2)
  - Insert `{ href: "/app/templates", label: "Templates" }` after the "Campaigns" entry
- [ ] Create `src/app/app/templates/page.tsx` as a server component (AC: 1)
  - [ ] Import `getTemplatesByCategory`, `getTemplateCategories`, and the full template list from `src/lib/templates/index.ts` (AC: 4, 7)
  - [ ] Render page title and description header (AC: 10)
  - [ ] Render category filter bar component (AC: 4, 8, 9)
  - [ ] Render template card grid (responsive: 1 col mobile, 2 col md, 3 col lg) (AC: 3)
- [ ] Create `src/app/app/templates/components/category-filter.tsx` as a client component (AC: 4, 8, 9)
  - [ ] "All" button plus one button per category from `getTemplateCategories()`
  - [ ] Active state styling: solid background for selected, outline for others
  - [ ] Filter updates URL search params (e.g., `?category=E-commerce`) for shareable URLs
- [ ] Create `src/app/app/templates/components/template-card.tsx` (AC: 3)
  - [ ] Display template name, category badge, description text
  - [ ] Placeholder thumbnail area (CSS-rendered preview or static gradient by category)
  - [ ] "Preview" button opens preview modal (AC: 5)
  - [ ] "Use Template" button triggers campaign creation flow (AC: 6)
- [ ] Create `src/app/app/templates/components/template-preview-modal.tsx` as a client component (AC: 5)
  - [ ] Modal/dialog overlay with backdrop
  - [ ] Reuse `FormPreview` component from F.4 (`src/app/app/campaigns/[id]/builder/components/form-preview.tsx`)
  - [ ] Pass template's FormSchema and FormStyle to FormPreview
  - [ ] Close button and "Use Template" CTA inside modal
- [ ] Create `src/app/app/templates/components/use-template-button.tsx` as a client component (AC: 6)
  - [ ] On click: POST to `/api/campaigns` with `{ name: template.name, siteId, templateId: template.id, schema: template.schema }`
  - [ ] Show loading state during request
  - [ ] On success: redirect to `/app/campaigns/[newCampaignId]/builder`
  - [ ] On error: show toast/inline error message
  - [ ] Requires site selection if merchant has multiple sites (dropdown or pre-selected from context)

## Dev Notes

### CRITICAL: Do NOT Recreate Templates

The template data layer is **already fully implemented** in `src/lib/templates/index.ts`. There are **10 templates** (not 6 as the previous version of this story stated). Do NOT create a new `src/lib/templates.ts` file or redefine the `CampaignTemplate` interface. Use the existing module directly:

```typescript
import {
  getTemplate,
  getTemplatesByCategory,
  getTemplateCategories
} from "@/lib/templates";
import type { CampaignTemplate } from "@/lib/templates";
```

The existing templates are:
1. `email-capture` (Lead Generation)
2. `welcome-discount` (E-commerce)
3. `exit-intent` (E-commerce)
4. `contact-form` (General)
5. `product-feedback` (Feedback)
6. `newsletter-signup` (Lead Generation)
7. `pre-launch-waitlist` (Lead Generation)
8. `cart-abandonment` (E-commerce)
9. `survey-nps` (Feedback)
10. `lead-qualification` (Lead Generation)

### Campaign Creation via Template

The "Use Template" flow calls the existing `POST /api/campaigns` endpoint. The endpoint already creates a campaign with a control variant. The template's schema fields should be passed as the variant's initial field configuration. No new API endpoints are needed for template data since it is static.

### FormPreview Reuse

The preview modal MUST reuse the `FormPreview` component built in Story F.4. Do NOT build a separate preview renderer. If F.4 is not yet complete, this story is blocked.

### Auth & RBAC

The templates page itself is read-only (no auth check needed beyond the existing Clerk middleware protecting `/app/*`). The "Use Template" action calls POST `/api/campaigns` which already enforces `withAccountContext()` and `canManageCampaigns()`.

### Design System

Follow the established Capturely design system:
- Page background: `bg-zinc-50 dark:bg-black`
- Card borders: `border border-zinc-200 dark:border-zinc-800`
- Card background: `bg-white dark:bg-zinc-900`
- Inputs/buttons: `rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100`
- Primary action buttons: consistent with existing campaign/site creation buttons
- Category badges: small rounded pills with category-specific colors

### No New API Endpoints

Template data is static and served from `src/lib/templates/index.ts`. The only API call is POST `/api/campaigns` (already exists). No `/api/templates` endpoint is needed.

### Project Structure Notes

- New files:
  - `src/app/app/templates/page.tsx`
  - `src/app/app/templates/components/category-filter.tsx`
  - `src/app/app/templates/components/template-card.tsx`
  - `src/app/app/templates/components/template-preview-modal.tsx`
  - `src/app/app/templates/components/use-template-button.tsx`
- Modified files:
  - `src/app/app/layout.tsx` (add "Templates" to navLinks)
- Existing files used (NOT modified):
  - `src/lib/templates/index.ts` (template data and helpers)
  - `src/app/app/campaigns/[id]/builder/components/form-preview.tsx` (reused in modal)
  - `src/app/api/campaigns/route.ts` (POST endpoint for campaign creation)

### Dependencies

- **BLOCKED BY:** Story F.4 (Builder Form Preview) — the `FormPreview` component must exist to reuse in the template preview modal
- **BLOCKS:** Nothing

### References

- [Source: src/lib/templates/index.ts — CampaignTemplate interface, getTemplate(), getTemplatesByCategory(), getTemplateCategories()]
- [Source: src/app/app/layout.tsx — navLinks array]
- [Source: src/app/api/campaigns/route.ts — POST campaign creation with control variant]
- [Source: src/app/app/campaigns/[id]/builder/components/form-preview.tsx — FormPreview component from F.4]
- [Source: docs/PRD.md#Gate G — Templates Gallery]

## Testing Notes

- Verify all 10 templates render as cards with correct name, category, and description
- Verify category filter shows 4 categories plus "All"
- Verify filtering by each category shows only templates in that category
- Verify "All" filter shows all 10 templates
- Verify preview modal opens and displays form using FormPreview component
- Verify "Use Template" creates a campaign via POST /api/campaigns and redirects to builder
- Verify the created campaign has the template's schema pre-populated in its control variant
- Verify page renders correctly in both light and dark mode
- Verify responsive layout: 1/2/3 columns at appropriate breakpoints
- Verify auth: unauthenticated users are redirected to sign-in (Clerk middleware)

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
