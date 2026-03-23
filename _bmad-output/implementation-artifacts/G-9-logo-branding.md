# Story G.9: Capturely Logo & Branding Component

Status: ready-for-dev

## Story

As a user,
I want to see a consistent Capturely brand logo across the application,
so that the product feels polished and professional.

## Acceptance Criteria

1. Reusable `Logo` component with SVG mark + wordmark
2. Supports size variants: small (icon only), medium (icon + text), large (full logo)
3. Supports light and dark mode variants
4. Logo is used in the dashboard header/navigation
5. Logo is used on auth pages (sign-in, sign-up)
6. Logo is used in the widget branding (free tier watermark)

## Tasks / Subtasks

- [ ] Create `src/components/logo.tsx` reusable component (AC: 1)
  - [ ] SVG logo mark (AC: 1)
  - [ ] Size prop: `sm`, `md`, `lg` (AC: 2)
  - [ ] Dark mode support via Tailwind `dark:` variants (AC: 3)
- [ ] Replace text "Capturely" in dashboard header with Logo component (AC: 4)
- [ ] Add Logo to auth layout (AC: 5)
- [ ] Create widget branding variant for free tier (AC: 6)

## Dev Notes

- Reference Figma: `components/logo.tsx`
- If no official brand assets exist yet, create a clean text-based logo
- Use SVG for scalability and dark mode support
- Keep the component simple — no external dependencies

### Project Structure Notes

- New file: `src/components/logo.tsx`
- Touches: `src/app/app/layout.tsx`, `src/app/(auth)/layout.tsx`

### References

- [Source: Figma Make — components/logo.tsx]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
