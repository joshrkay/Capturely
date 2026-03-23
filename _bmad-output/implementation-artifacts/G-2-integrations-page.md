# Story G.2: Integrations Management Page

Status: ready-for-dev

## Story

As a merchant,
I want an integrations page listing available platforms and services,
so that I can connect Capturely to my Shopify store, WordPress site, Zapier, and webhooks.

## Acceptance Criteria

1. Integrations page is accessible from navigation at `/app/integrations`
2. Page displays integration cards for: Shopify, WordPress, Zapier, Custom Webhooks
3. Each card shows: platform name, logo, description, connection status (connected/not connected)
4. Shopify card links to Shopify OAuth install flow (Story H.1)
5. WordPress card shows plugin download / installation instructions
6. Zapier card shows webhook URL for Zapier integration
7. Webhooks card allows CRUD of custom webhook endpoints (URL, events, secret)
8. Connected integrations show a "Manage" or "Disconnect" action
9. Integration status persists in the database

## Tasks / Subtasks

- [ ] Create Integration model in Prisma schema (platform, accountId, credentials, status) (AC: 9)
- [ ] Run Prisma migration (AC: 9)
- [ ] Create `src/app/app/integrations/page.tsx` page component (AC: 1)
  - [ ] Integration card grid layout (AC: 2)
  - [ ] Status badges per card (AC: 3)
  - [ ] Platform-specific action buttons (AC: 4, 5, 6, 7)
- [ ] Create webhook management sub-component (AC: 7)
  - [ ] Add webhook form (URL, events multi-select, signing secret)
  - [ ] List existing webhooks with edit/delete
  - [ ] Webhook test button (send sample payload)
- [ ] Create `/api/integrations` CRUD endpoints (AC: 8, 9)
- [ ] Create `/api/webhooks` CRUD endpoints (AC: 7)
- [ ] Add "Integrations" link to dashboard navigation (AC: 1)

## Dev Notes

- Reference Figma: `pages/integrations.tsx`
- Webhook model already exists in Prisma schema — verify and extend if needed
- Shopify OAuth is a separate story (H.1) — this page just links to it
- WordPress integration is install-instructions-only for now (no live API connection)
- Zapier integration works via webhooks — show the webhook URL formatted for Zapier
- All DB queries scoped to `accountId`

### Project Structure Notes

- New files: `src/app/app/integrations/page.tsx`, `src/app/api/integrations/route.ts`, `src/app/api/webhooks/route.ts`
- Touches: `prisma/schema.prisma`, `src/app/app/layout.tsx`

### References

- [Source: Figma Make — pages/integrations.tsx]
- [Source: prisma/schema.prisma#Webhook]
- [Source: docs/PRD.md#Gate C — Webhook Delivery]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
