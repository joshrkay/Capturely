# Story G.9: Capturely Logo & Branding Component

Status: ready-for-dev

## Story

As a user,
I want to see a consistent Capturely brand logo across the application,
so that the product feels polished and professional.

## Acceptance Criteria

1. Reusable `Logo` component at `src/components/logo.tsx` with SVG mark + wordmark "Capturely"
2. Supports size variants: `sm` (icon only, 24px), `md` (icon + text, 32px height), `lg` (full logo, 48px height)
3. Supports light and dark mode — light: indigo-600 icon / zinc-900 text; dark: indigo-400 icon / zinc-50 text
4. Logo replaces the text heading in the dashboard sidebar/header layout
5. Logo appears on auth pages (sign-in, sign-up)
6. Widget branding: "Powered by Capturely" text + small logo shown for free-tier users
7. Component accepts `{ size: 'sm' | 'md' | 'lg'; className?: string }` props
8. Pure SVG + Tailwind — zero external dependencies

## Tasks / Subtasks

- [ ] Design SVG logo mark (AC: 1)
  - [ ] Create a clean geometric icon — stylized "C" or capture/form icon
  - [ ] Ensure it renders crisply at 24px, 32px, and 48px
  - [ ] Use `currentColor` or Tailwind fill classes for color theming
- [ ] Create `src/components/logo.tsx` reusable component (AC: 1, 7, 8)
  - [ ] Define `LogoProps` interface: `{ size: 'sm' | 'md' | 'lg'; className?: string }`
  - [ ] Implement `sm` variant: icon only, 24px square (AC: 2)
  - [ ] Implement `md` variant: icon (32px) + "Capturely" wordmark inline (AC: 2)
  - [ ] Implement `lg` variant: icon (48px) + "Capturely" wordmark, larger text (AC: 2)
  - [ ] Apply light mode colors: `text-indigo-600` icon, `text-zinc-900` wordmark (AC: 3)
  - [ ] Apply dark mode colors: `dark:text-indigo-400` icon, `dark:text-zinc-50` wordmark (AC: 3)
  - [ ] Accept and merge `className` prop for layout overrides (AC: 7)
  - [ ] Export as named export `Logo` (default size: `md`)
- [ ] Replace text heading in dashboard layout (AC: 4)
  - [ ] Open `src/app/app/layout.tsx`
  - [ ] Remove `<h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Capturely</h1>` at lines 25-27
  - [ ] Replace with `<Logo size="md" />`
  - [ ] Import `Logo` from `@/components/logo`
- [ ] Add Logo to auth layout (AC: 5)
  - [ ] Open `src/app/(auth)/layout.tsx`
  - [ ] Add `<Logo size="lg" />` centered above the auth card/form
  - [ ] Import `Logo` from `@/components/logo`
- [ ] Create widget branding variant for free tier (AC: 6)
  - [ ] In `packages/widget/popup.ts`, add "Powered by Capturely" footer element
  - [ ] Include a small inline SVG version of the logo mark (sm size)
  - [ ] Only render when the campaign config indicates free tier
  - [ ] Style with subtle gray text, small font size, non-intrusive placement

## Dev Notes

- If no official brand assets exist yet, create a clean geometric icon. A stylized "C" built from two overlapping rounded rectangles or a capture-frame motif works well at small sizes.
- The SVG must be defined inline (not as an external file) so Tailwind color utilities apply directly.
- Use `aria-label="Capturely"` on the SVG for accessibility; the wordmark text should be selectable.
- For the `sm` variant, omit the wordmark entirely — only render the icon mark.
- The widget branding SVG in `popup.ts` must be self-contained vanilla JS (no React). Duplicate the SVG path data as a template literal string.
- Keep the SVG path count low (under 5 paths) so the icon is lightweight for both the dashboard and the widget bundle.

### Size Variant Reference

| Variant | Icon Size | Wordmark | Total Height | Use Case |
|---------|-----------|----------|--------------|----------|
| `sm`    | 24 x 24  | Hidden   | 24px         | Favicon, collapsed sidebar, widget branding |
| `md`    | 32 x 32  | Shown    | 32px         | Dashboard header, navigation bar |
| `lg`    | 48 x 48  | Shown    | 48px         | Auth pages, landing page hero |

### Color Token Reference

| Element   | Light Mode    | Dark Mode      | Tailwind Class                              |
|-----------|---------------|----------------|---------------------------------------------|
| Icon fill | indigo-600    | indigo-400     | `text-indigo-600 dark:text-indigo-400`      |
| Wordmark  | zinc-900      | zinc-50        | `text-zinc-900 dark:text-zinc-50`           |

### Component API

```tsx
interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Usage examples
<Logo />                          // md by default
<Logo size="sm" />                // icon only
<Logo size="lg" className="mb-8" /> // auth page hero
```

### Integration Points

- **Dashboard layout** (`src/app/app/layout.tsx` lines 25-27): Replace the existing `<h1>` with `<Logo size="md" />`. The surrounding flex container should remain unchanged.
- **Auth layout** (`src/app/(auth)/layout.tsx`): Center `<Logo size="lg" />` above the Clerk `<SignIn />` / `<SignUp />` component.
- **Widget popup** (`packages/widget/popup.ts`): Append a "Powered by Capturely" footer div with inline SVG. This is vanilla JS — no React imports.

### Project Structure Notes

- New file: `src/components/logo.tsx`
- Touches: `src/app/app/layout.tsx` (replace h1 with Logo component)
- Touches: `src/app/(auth)/layout.tsx` (add Logo above auth forms)
- Touches: `packages/widget/popup.ts` (add free-tier branding footer)

### Dependencies

- **BLOCKED BY:** Nothing (Tier 0 — can start immediately)
- **BLOCKS:** Nothing
- No external packages required; pure SVG + Tailwind

### Testing Checklist

- [ ] Logo renders at all three sizes without visual clipping
- [ ] Dark mode toggle switches icon from indigo-600 to indigo-400 and text from zinc-900 to zinc-50
- [ ] `sm` variant shows only the icon mark with no wordmark text
- [ ] `md` and `lg` variants show both icon and "Capturely" wordmark
- [ ] `className` prop correctly merges with internal classes
- [ ] Dashboard header displays `<Logo size="md" />` where the old `<h1>` was
- [ ] Auth pages display `<Logo size="lg" />` centered above the form
- [ ] Widget "Powered by Capturely" footer renders only on free-tier campaigns
- [ ] SVG is accessible (`aria-label` present, wordmark text is selectable)
- [ ] No layout shift when logo loads (dimensions are fixed by variant)

### Error Handling

- Invalid `size` prop: TypeScript will catch at compile time; no runtime guard needed.
- Missing `className`: defaults to empty string, no crash.
- Widget branding: if campaign config is missing tier info, default to showing branding (safe fallback for free tier).

### References

- [Source: Figma Make — components/logo.tsx]
- [Source: src/app/app/layout.tsx — current text heading at lines 25-27]
- [Source: src/app/(auth)/layout.tsx — auth page layout]
- [Source: packages/widget/popup.ts — widget popup rendering]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
