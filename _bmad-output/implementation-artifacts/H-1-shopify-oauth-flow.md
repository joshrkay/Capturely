# Story H.1: Shopify OAuth Install Flow

Status: ready-for-dev

## Story

As a Shopify merchant,
I want to install Capturely from the Shopify App Store via OAuth,
so that my store is automatically connected and the widget is embedded.

## Acceptance Criteria

1. Install page at `/auth/shopify-install` initiates Shopify OAuth with required scopes
2. Callback page at `/auth/shopify-callback` exchanges the auth code for an access token
3. Success page at `/auth/shopify-success` confirms installation and shows next steps
4. Access token is securely stored in the Integration model (encrypted at rest)
5. A Site record is auto-created for the Shopify store domain
6. The widget script tag is injected into the Shopify theme via ScriptTag API
7. Error states are handled gracefully (denied permissions, invalid HMAC, expired nonce)
8. HMAC signature validation on callback prevents CSRF
9. Existing installations are detected and handled (re-install = reconnect, not duplicate)

## Tasks / Subtasks

- [ ] Create `src/app/auth/shopify-install/page.tsx` (AC: 1)
  - [ ] Generate nonce, store in session/cookie
  - [ ] Redirect to Shopify OAuth URL with scopes and redirect_uri
- [ ] Create `src/app/auth/shopify-callback/page.tsx` (AC: 2)
  - [ ] Validate HMAC signature (AC: 8)
  - [ ] Exchange code for access token
  - [ ] Store token in Integration model (AC: 4)
  - [ ] Auto-create Site record for shop domain (AC: 5)
  - [ ] Inject widget ScriptTag (AC: 6)
  - [ ] Handle re-install (update existing integration) (AC: 9)
- [ ] Create `src/app/auth/shopify-success/page.tsx` (AC: 3)
  - [ ] Show success message with store name
  - [ ] Display next steps (create first campaign, configure settings)
  - [ ] Link to dashboard
- [ ] Create `src/lib/shopify.ts` utility (OAuth URL builder, token exchange, HMAC validation)
- [ ] Add error handling for all OAuth failure modes (AC: 7)
- [ ] Add env vars: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_SCOPES`

## Dev Notes

- Reference Figma: `pages/auth/shopify-install.tsx`, `shopify-callback.tsx`, `shopify-success.tsx`
- Shopify OAuth flow: https://shopify.dev/docs/apps/auth/oauth
- Required scopes: `read_products`, `read_customers`, `write_script_tags`, `read_orders`
- Access tokens should be encrypted before DB storage — use a symmetric encryption helper
- The ScriptTag API injects `widget.js` globally on the merchant's storefront
- Nonce must be verified on callback to prevent CSRF

### Project Structure Notes

- New files: `src/app/auth/shopify-install/page.tsx`, `src/app/auth/shopify-callback/page.tsx`, `src/app/auth/shopify-success/page.tsx`, `src/lib/shopify.ts`
- Touches: `prisma/schema.prisma` (Integration model), `.env.local`

### References

- [Source: Figma Make — pages/auth/shopify-install.tsx, shopify-callback.tsx, shopify-success.tsx]
- [Source: docs/PRD.md#Gate C — Platform Integrations]
- [Source: docs/BUILT-FEATURES.md#Shopify OAuth Flow]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
