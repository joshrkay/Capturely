# Story H.1: Shopify OAuth Install Flow

Status: ready-for-dev

---

## Story

As a Shopify merchant,
I want to install Capturely from the Shopify App Store via OAuth,
so that my store is automatically connected, a Site record is created, and the widget script tag is injected into my theme without manual configuration.

---

## Dependencies

- **BLOCKED BY:** G.2 (Integrations Management Page) -- requires the `Integration` model (`{ id, accountId, platform, status, credentials, metadata }`) and its `@@unique([accountId, platform])` constraint
- **BLOCKS:** Nothing (Tier 5, leaf story)
- **Requires env vars:** `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_SCOPES=read_products,read_customers,write_script_tags,read_orders`
- **Existing infra used:** `withAccountContext()` from `src/lib/account.ts`, `canManageSites()` from `src/lib/rbac.ts`, `generatePublicKey()` / `generateSecretKey()` from `src/lib/keys.ts`, Prisma `Site` model, Prisma `Integration` model (from G.2)

---

## Existing Code Inventory

| File | Relevance |
|------|-----------|
| `prisma/schema.prisma` | Site model (lines 91-111), Integration model added by G.2 |
| `src/lib/account.ts` | `withAccountContext()` resolves `accountId` + `role` from Clerk session |
| `src/lib/rbac.ts` | `canManageSites()` for authorization gating |
| `src/lib/keys.ts` | `generatePublicKey()`, `generateSecretKey()` for new Site records |
| `src/lib/db.ts` | Prisma client singleton |
| `src/app/app/layout.tsx` | Dashboard layout, nav links, design patterns |
| `src/app/app/sites/page.tsx` | Reference for Site creation patterns |

---

## Acceptance Criteria

1. Install page at `/auth/shopify-install` accepts a `shop` query parameter and initiates Shopify OAuth with required scopes (`read_products,read_customers,write_script_tags,read_orders`)
2. Install page generates a cryptographically random nonce, stores it in an HTTP-only secure cookie, and redirects the browser to the Shopify OAuth authorization URL
3. Callback route handler at `/auth/shopify-callback` validates the HMAC signature on the query string using `SHOPIFY_API_SECRET` before any other processing
4. Callback handler verifies the nonce from the query matches the nonce stored in the HTTP-only cookie to prevent replay attacks
5. Callback handler exchanges the authorization code for a permanent access token via POST to `https://{shop}/admin/oauth/access_token`
6. Access token is encrypted at rest using AES-256-GCM (key derived from `RUNTIME_SIGNING_SECRET`) before storage in the Integration `credentials` field
7. Encryption format is base64-encoded `iv:encrypted:authTag` with a random 12-byte IV per call
8. A Site record is auto-created with `{ name: shop, primaryDomain: shop, platformType: 'shopify' }` and generated public/secret keys
9. The Capturely widget script tag (`<script src="https://cdn.capturely.io/widget.js" data-pk="{publicKey}">`) is injected into the Shopify store via the ScriptTag REST API
10. Re-install scenario: when an Integration with `accountId + platform='shopify'` already exists, the token is updated (not duplicated) and the existing Site is reused
11. Success page at `/auth/shopify-success` displays the connected store name and provides clear next-step actions (go to dashboard, create first campaign)
12. Error states are handled gracefully with user-facing messages: merchant denied permissions, invalid HMAC signature, expired/mismatched nonce, network failure during token exchange, ScriptTag injection failure
13. All database writes are scoped to the authenticated user's `accountId` via `withAccountContext()`
14. RBAC enforced: `canManageSites()` (owner/admin) required for the OAuth flow
15. The nonce cookie is cleared after callback processing regardless of success or failure

---

## Prisma Schema Changes

No new models are required. This story depends on the `Integration` model created in G.2:

```prisma
model Integration {
  id          String   @id @default(cuid())
  accountId   String   @map("account_id")
  platform    String   // "shopify", "wordpress", "zapier", "custom"
  status      String   @default("disconnected") // "connected", "disconnected", "error"
  credentials String?  // encrypted JSON blob for OAuth tokens
  metadata    String?  // JSON blob for platform-specific config (e.g., shop domain, siteId)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([accountId])
  @@unique([accountId, platform])
  @@map("integrations")
}
```

The existing `Site` model (lines 91-111 in `schema.prisma`) is used as-is. The `platformType` field stores `'shopify'`.

---

## API Contracts

### GET `/auth/shopify-install?shop=mystore.myshopify.com`

Server Component page. No JSON response -- performs a server-side redirect.

**Query params:**
- `shop` (required): The `*.myshopify.com` domain

**Behavior:**
1. Validate `shop` matches pattern `^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$`
2. Generate 32-byte hex nonce via `crypto.randomBytes(32).toString('hex')`
3. Set HTTP-only cookie `shopify_nonce` with value = nonce, `SameSite=Lax`, `Secure=true`, `Max-Age=300`
4. Redirect to `https://{shop}/admin/oauth/authorize?client_id={SHOPIFY_API_KEY}&scope={SHOPIFY_SCOPES}&redirect_uri={callback_url}&state={nonce}`

**Errors:**
- Missing/invalid `shop` param: render error message on page

---

### GET `/auth/shopify-callback?code=...&hmac=...&shop=...&state=...&timestamp=...`

Route Handler (`route.ts`). No UI -- redirects on completion.

**Query params (from Shopify):**
- `code`: Authorization code
- `hmac`: HMAC signature of other params
- `shop`: Store domain
- `state`: Nonce for verification
- `timestamp`: Request timestamp

**Success flow:**
1. Validate HMAC: remove `hmac` from params, sort remaining, join as `key=value&...`, compute `crypto.createHmac('sha256', SHOPIFY_API_SECRET).update(message).digest('hex')`, compare with constant-time equality
2. Verify `state` matches `shopify_nonce` cookie
3. Clear the nonce cookie
4. Exchange code: POST `https://{shop}/admin/oauth/access_token` with `{ client_id, client_secret, code }`
5. Encrypt the returned `access_token` using `encrypt()` from `src/lib/encryption.ts`
6. Upsert Integration: `prisma.integration.upsert({ where: { accountId_platform }, create: {...}, update: { credentials, status: 'connected' } })`
7. Create or find Site: check for existing Site with `accountId + primaryDomain = shop`, create if not found
8. Call ScriptTag API: POST `https://{shop}/admin/api/2024-01/script_tags.json` with `{ event: 'onload', src: widgetUrl }`
9. Store `siteId` and `shop` in Integration `metadata` JSON
10. Redirect to `/auth/shopify-success?shop={shop}`

**Error responses:**
- Invalid HMAC: redirect to `/auth/shopify-install?error=invalid_hmac`
- Nonce mismatch: redirect to `/auth/shopify-install?error=nonce_mismatch`
- Token exchange failure: redirect to `/auth/shopify-install?error=exchange_failed`
- Auth missing: redirect to `/sign-in`

---

### GET `/auth/shopify-success?shop=mystore.myshopify.com`

Server Component page. Renders confirmation UI.

**Query params:**
- `shop`: Store domain for display

---

## Component Architecture

```
src/
  app/
    auth/
      shopify-install/
        page.tsx              # Server Component: validates shop, sets nonce cookie, redirects
      shopify-callback/
        route.ts              # Route Handler: HMAC validation, token exchange, Site creation, ScriptTag injection
      shopify-success/
        page.tsx              # Server Component: success confirmation with store name + CTAs
  lib/
    shopify.ts                # Shopify OAuth utility functions
    encryption.ts             # AES-256-GCM encrypt/decrypt utilities
```

### `src/lib/shopify.ts` exports

```typescript
export function buildInstallUrl(shop: string, nonce: string): string
// Constructs the full Shopify OAuth authorize URL with client_id, scopes, redirect_uri, state

export function validateHmac(query: Record<string, string>, secret: string): boolean
// Removes 'hmac' key, sorts remaining params, joins as query string,
// computes crypto.createHmac('sha256', secret).update(message).digest('hex'),
// uses crypto.timingSafeEqual for comparison

export async function exchangeToken(shop: string, code: string): Promise<string>
// POSTs to https://{shop}/admin/oauth/access_token with { client_id, client_secret, code }
// Returns the access_token string from the response

export async function installScriptTag(shop: string, token: string, scriptUrl: string): Promise<void>
// POSTs to https://{shop}/admin/api/2024-01/script_tags.json
// Headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' }
// Body: { script_tag: { event: 'onload', src: scriptUrl } }
```

### `src/lib/encryption.ts` exports

```typescript
export function encrypt(plaintext: string): string
// AES-256-GCM, key derived from RUNTIME_SIGNING_SECRET via HKDF/SHA-256
// Generates random 12-byte IV per call
// Returns base64-encoded 'iv:encrypted:authTag'

export function decrypt(ciphertext: string): string
// Parses base64 'iv:encrypted:authTag', decrypts with same derived key
// Throws on tampered data (GCM auth tag verification)
```

---

## UI States

### Install Page (`/auth/shopify-install`)

| State | Display |
|-------|---------|
| Loading | Centered card with spinner, "Connecting to Shopify..." |
| Missing `shop` param | Error card: "Invalid request. Please install from the Shopify App Store." |
| Invalid `shop` format | Error card: "Invalid store URL. Expected format: yourstore.myshopify.com" |
| `?error=invalid_hmac` | Error card: "Security validation failed. Please try installing again." |
| `?error=nonce_mismatch` | Error card: "Session expired. Please try installing again." |
| `?error=exchange_failed` | Error card: "Could not connect to Shopify. Please try again later." |
| Valid shop | Brief flash before redirect (card with "Redirecting to Shopify...") |

### Success Page (`/auth/shopify-success`)

| State | Display |
|-------|---------|
| Default | Centered card with checkmark icon, "Store connected!" heading, shop name, two CTAs: "Go to Dashboard" and "Create Your First Campaign" |
| Missing `shop` | Fallback: "Your Shopify store has been connected." (no shop name shown) |

---

## Design System

Auth pages follow a centered card layout consistent with existing Clerk auth pages:

- **Container:** `flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black`
- **Card:** `w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900`
- **Logo:** Capturely logo centered above card
- **Headings:** `text-xl font-semibold text-zinc-900 dark:text-zinc-100`
- **Body text:** `text-sm text-zinc-600 dark:text-zinc-400`
- **Error text:** `text-sm text-red-600 dark:text-red-400`
- **Primary button:** `bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2`
- **Secondary button:** `border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2`
- **Success icon:** Green checkmark circle, `text-green-500`

---

## Accessibility

- All error messages use `role="alert"` and `aria-live="assertive"`
- Success page checkmark has `aria-hidden="true"` with adjacent text conveying the same information
- All buttons have visible focus rings (`focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`)
- Page titles set via `metadata.title` for screen reader announcement on navigation
- Loading states use `aria-busy="true"` on the container
- Color contrast meets WCAG 2.1 AA for all text/background combinations
- CTA links are `<a>` elements styled as buttons with proper `href` attributes

---

## Testing Plan

### Unit Tests (`src/lib/__tests__/`)

1. `shopify.test.ts` -- `buildInstallUrl()` returns correct URL with all params
2. `shopify.test.ts` -- `buildInstallUrl()` URL-encodes the redirect_uri
3. `shopify.test.ts` -- `validateHmac()` returns `true` for valid HMAC
4. `shopify.test.ts` -- `validateHmac()` returns `false` for tampered params
5. `shopify.test.ts` -- `validateHmac()` returns `false` for missing hmac key
6. `shopify.test.ts` -- `exchangeToken()` calls correct Shopify endpoint with correct body
7. `shopify.test.ts` -- `exchangeToken()` throws on non-200 response
8. `shopify.test.ts` -- `installScriptTag()` sends correct headers and body
9. `encryption.test.ts` -- `encrypt()` then `decrypt()` round-trips correctly
10. `encryption.test.ts` -- `decrypt()` throws on tampered ciphertext
11. `encryption.test.ts` -- `encrypt()` produces different output for same input (random IV)
12. `encryption.test.ts` -- `decrypt()` throws on malformed input (missing segments)

### Integration Tests (`src/app/auth/__tests__/`)

13. Callback route returns redirect to success on valid flow (mock Shopify API)
14. Callback route rejects invalid HMAC and redirects with error
15. Callback route rejects mismatched nonce and redirects with error
16. Callback route handles token exchange failure gracefully
17. Re-install scenario: existing Integration is updated, not duplicated
18. Site is created with correct `platformType: 'shopify'` and generated keys
19. ScriptTag API failure does not prevent Integration/Site creation (degrades gracefully)

---

## Anti-Patterns to Avoid

- **DO NOT** store the Shopify access token in plaintext -- always use `encrypt()` before writing to `credentials`
- **DO NOT** use string comparison for HMAC validation -- use `crypto.timingSafeEqual` to prevent timing attacks
- **DO NOT** skip nonce verification -- it prevents CSRF/replay attacks on the callback
- **DO NOT** expose `SHOPIFY_API_SECRET` in client-side code -- all Shopify interactions happen server-side
- **DO NOT** create a new Integration record on re-install -- upsert on `@@unique([accountId, platform])` constraint
- **DO NOT** use `any` type for Shopify API responses -- define typed interfaces for token exchange and ScriptTag responses
- **DO NOT** let ScriptTag injection failure block the entire flow -- log the error, mark in metadata, let the merchant retry from the dashboard
- **DO NOT** hardcode the widget CDN URL -- read from an env var or constant (`NEXT_PUBLIC_WIDGET_URL` or config)

---

## Tasks

1. - [ ] **Create `src/lib/encryption.ts`** -- implement `encrypt(plaintext)` and `decrypt(ciphertext)` using AES-256-GCM with key derived from `RUNTIME_SIGNING_SECRET` via HKDF (AC: 6, 7)
2. - [ ] **Write unit tests for encryption** -- round-trip, tamper detection, random IV uniqueness, malformed input (AC: 6, 7)
3. - [ ] **Create `src/lib/shopify.ts`** -- implement `buildInstallUrl(shop, nonce)` returning full Shopify OAuth URL (AC: 1, 2)
4. - [ ] **Implement `validateHmac(query, secret)`** in `src/lib/shopify.ts` -- HMAC-SHA256 with `crypto.timingSafeEqual` (AC: 3, 8)
5. - [ ] **Implement `exchangeToken(shop, code)`** in `src/lib/shopify.ts` -- POST to Shopify token endpoint, return access_token (AC: 5)
6. - [ ] **Implement `installScriptTag(shop, token, scriptUrl)`** in `src/lib/shopify.ts` -- POST to ScriptTag API with auth header (AC: 9)
7. - [ ] **Write unit tests for shopify.ts** -- all four functions, happy path and error cases (AC: 3, 5, 8, 9)
8. - [ ] **Create install page `src/app/auth/shopify-install/page.tsx`** -- validate `shop` param, generate nonce, set HTTP-only cookie, redirect to Shopify OAuth URL (AC: 1, 2)
9. - [ ] **Handle error query params on install page** -- display contextual error cards for `invalid_hmac`, `nonce_mismatch`, `exchange_failed` (AC: 12)
10. - [ ] **Create callback route handler `src/app/auth/shopify-callback/route.ts`** -- validate HMAC, verify nonce cookie, clear cookie (AC: 3, 4, 15)
11. - [ ] **Add token exchange to callback** -- call `exchangeToken()`, encrypt result, upsert Integration record with `credentials` and `status: 'connected'` (AC: 5, 6, 10)
12. - [ ] **Add Site auto-creation to callback** -- check for existing Site by `accountId + primaryDomain`, create with `platformType: 'shopify'` and generated keys if not found (AC: 8, 10)
13. - [ ] **Add ScriptTag injection to callback** -- call `installScriptTag()`, store siteId in Integration metadata, handle failure gracefully (AC: 9, 12)
14. - [ ] **Create success page `src/app/auth/shopify-success/page.tsx`** -- centered card with store name, checkmark, dashboard + campaign CTAs (AC: 11)
15. - [ ] **Add env var validation** -- check `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_SCOPES` are present at startup or in the install page (AC: 1)
16. - [ ] **Write integration tests for callback route** -- mock Shopify API, test full happy path, HMAC rejection, nonce mismatch, re-install upsert (AC: 3, 4, 10, 12)
17. - [ ] **Accessibility audit** -- verify `role="alert"` on errors, focus management, color contrast, `aria-busy` on loading states (AC: 12)
18. - [ ] **Update `.env.example`** -- add `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_SCOPES` with placeholder values

---

## Dev Notes

- The `RUNTIME_SIGNING_SECRET` is reused as the encryption key source for simplicity. Use HKDF with a unique info/salt to derive the AES key so it is not identical to the JWT signing key.
- Shopify ScriptTag API is a legacy API but still supported. For newer themes using Online Store 2.0, an app embed block may eventually be needed, but ScriptTag covers the common case.
- The callback route must handle the case where the user is not logged into Capturely. If `withAccountContext()` fails (no Clerk session), redirect to `/sign-in` with a `redirect_url` back to the install page.
- Nonce cookie `Max-Age=300` (5 minutes) provides a reasonable window for the merchant to approve the OAuth prompt.
- The `metadata` JSON field on Integration should store: `{ "shop": "mystore.myshopify.com", "siteId": "clxyz...", "scriptTagId": 12345 }` for later management (disconnect, re-inject).
- On re-install, check whether the ScriptTag already exists before creating a duplicate. The ScriptTag GET endpoint can list existing tags filtered by `src`.
- Widget URL should be a constant: `const WIDGET_CDN_URL = process.env.NEXT_PUBLIC_WIDGET_URL || 'https://cdn.capturely.io/widget.js'`

---

## References

- [Shopify OAuth Documentation](https://shopify.dev/docs/apps/auth/oauth)
- [Shopify ScriptTag REST API](https://shopify.dev/docs/api/admin-rest/2024-01/resources/scripttag)
- [Node.js crypto.createHmac](https://nodejs.org/api/crypto.html#cryptocreatehmaCalgorithm-key-options)
- [AES-256-GCM in Node.js](https://nodejs.org/api/crypto.html#class-cipher)
- G.2 Integration model: `_bmad-output/implementation-artifacts/G-2-integrations-page.md`
- Existing Site creation pattern: `src/app/app/sites/page.tsx`

---

## Dev Agent Record

| Field | Value |
|-------|-------|
| Story ID | H.1 |
| Title | Shopify OAuth Install Flow |
| Gate | H (Shopify Native) |
| Tier | 5 |
| Status | ready-for-dev |
| Blocked by | G.2 (Integration model) |
| Blocks | None |
| Estimated complexity | Medium-High |
| New files | `src/lib/shopify.ts`, `src/lib/encryption.ts`, `src/app/auth/shopify-install/page.tsx`, `src/app/auth/shopify-callback/route.ts`, `src/app/auth/shopify-success/page.tsx` |
| Modified files | `.env.example` |
| Schema changes | None (depends on G.2 Integration model) |
| Env vars added | `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_SCOPES` |
| Test coverage target | Unit: encryption + shopify utils; Integration: callback route handler |
