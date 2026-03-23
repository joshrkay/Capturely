# Story H.1: Shopify OAuth Install Flow

Status: ready-for-dev

## Story

As a Shopify merchant,
I want to install Capturely from the Shopify App Store via OAuth,
so that my store is automatically connected and the widget is embedded.

## Acceptance Criteria

1. Install page at `/auth/shopify-install` initiates Shopify OAuth with required scopes
2. Callback handler at `/auth/shopify-callback` validates HMAC, exchanges code for access token, stores encrypted token, and creates a Site record
3. Success page at `/auth/shopify-success` confirms installation with store name and next steps
4. Access token is encrypted at rest using AES-256-GCM before DB storage
5. A Site record is auto-created: `{ name: shop, primaryDomain: shop, platformType: 'shopify' }`
6. The widget `<script>` tag is injected into the Shopify theme via the ScriptTag API
7. Error states handled gracefully: denied permissions, invalid HMAC, expired nonce, network failures
8. HMAC signature validation on callback prevents CSRF attacks
9. Re-install detected by `accountId + platform='shopify'` lookup — updates token, does not duplicate records
10. Nonce stored in HTTP-only cookie, verified on callback to prevent replay attacks

## Tasks / Subtasks

- [ ] Create `src/lib/encryption.ts` utility (AC: 4)
  - [ ] `encrypt(plaintext: string): string` — AES-256-GCM encryption
    - Derive key from `RUNTIME_SIGNING_SECRET` using PBKDF2 or HKDF
    - Generate random 12-byte IV per encryption call
    - Return base64-encoded `iv:encrypted:authTag` string
  - [ ] `decrypt(ciphertext: string): string` — reverse of encrypt
    - Parse `iv:encrypted:authTag` from base64 input
    - Derive same key from `RUNTIME_SIGNING_SECRET`
    - Decrypt and return plaintext
  - [ ] Add unit tests for encrypt/decrypt round-trip and tamper detection
- [ ] Create `src/lib/shopify.ts` utility (AC: 1, 2, 6, 8)
  - [ ] `buildInstallUrl(shop: string, nonce: string): string`
    - Construct `https://{shop}/admin/oauth/authorize` URL
    - Include `client_id`, `scope`, `redirect_uri`, `state` (nonce) params
    - Read scopes from `SHOPIFY_SCOPES` env var
  - [ ] `validateHmac(query: Record<string, string>, secret: string): boolean`
    - Sort query params alphabetically (excluding `hmac` itself)
    - Compute `crypto.createHmac('sha256', secret).update(message).digest('hex')`
    - Timing-safe comparison with provided `hmac` value
  - [ ] `exchangeToken(shop: string, code: string): Promise<string>`
    - POST to `https://{shop}/admin/oauth/access_token`
    - Body: `{ client_id, client_secret, code }`
    - Return the `access_token` string from response
  - [ ] `installScriptTag(shop: string, token: string, scriptUrl: string): Promise<void>`
    - POST to `https://{shop}/admin/api/2024-01/script_tags.json`
    - Headers: `X-Shopify-Access-Token: {token}`
    - Body: `{ script_tag: { event: 'onload', src: scriptUrl } }`
- [ ] Create `src/app/auth/shopify-install/page.tsx` (AC: 1, 10)
  - [ ] Read `shop` query parameter, validate it matches `*.myshopify.com` pattern
  - [ ] Generate cryptographic nonce via `crypto.randomUUID()`
  - [ ] Set nonce in HTTP-only, Secure, SameSite=Lax cookie (5-minute expiry)
  - [ ] Build OAuth URL via `buildInstallUrl(shop, nonce)`
  - [ ] Redirect to Shopify OAuth URL
  - [ ] Show error UI if `shop` param is missing or malformed
- [ ] Create `src/app/auth/shopify-callback/route.ts` as Route Handler (AC: 2, 5, 6, 8, 9, 10)
  - [ ] Extract all query params: `code`, `hmac`, `shop`, `state`, `timestamp`
  - [ ] Validate HMAC signature via `validateHmac()` — reject with 403 if invalid (AC: 8)
  - [ ] Read nonce cookie, compare to `state` param — reject with 403 if mismatch (AC: 10)
  - [ ] Clear nonce cookie after validation
  - [ ] Exchange code for access token via `exchangeToken()` (AC: 2)
  - [ ] Encrypt token via `encrypt()` from `src/lib/encryption.ts` (AC: 4)
  - [ ] Resolve `accountId` from Clerk session via `withAccountContext()`
  - [ ] Check for existing Integration: `findFirst({ where: { accountId, platform: 'shopify' } })`
    - If exists: update `credentials` field with new encrypted token (AC: 9)
    - If not: create new Integration record with encrypted token
  - [ ] Auto-create Site record: `{ name: shop, primaryDomain: shop, platformType: 'shopify', accountId }` (AC: 5)
    - Skip if Site with same `primaryDomain` already exists for this account
  - [ ] Inject widget script tag via `installScriptTag()` (AC: 6)
  - [ ] Redirect to `/auth/shopify-success?shop={shop}`
  - [ ] Wrap entire flow in try/catch — redirect to error page on failure (AC: 7)
- [ ] Create `src/app/auth/shopify-success/page.tsx` (AC: 3)
  - [ ] Read `shop` query parameter
  - [ ] Display success confirmation with store name
  - [ ] Show next steps: "Create your first campaign", "Configure widget settings"
  - [ ] Link to dashboard at `/app`
  - [ ] Link to campaigns page at `/app/campaigns`
- [ ] Add environment variables (AC: 1, 2)
  - [ ] `SHOPIFY_API_KEY` — Shopify app client ID
  - [ ] `SHOPIFY_API_SECRET` — Shopify app client secret
  - [ ] `SHOPIFY_SCOPES` — default: `read_products,read_customers,write_script_tags,read_orders`
  - [ ] Document in `.env.local.example`
- [ ] Add error handling for all OAuth failure modes (AC: 7)
  - [ ] HMAC validation failure: log warning, show "Installation could not be verified" page
  - [ ] Nonce mismatch: log warning, show "Session expired, please try again" with retry link
  - [ ] Token exchange failure: log error, show "Could not connect to Shopify" with retry link
  - [ ] ScriptTag injection failure: log error but do NOT block installation (non-critical)
  - [ ] Missing Clerk session: redirect to sign-in with return URL

## Dev Notes

- The callback route MUST be a Route Handler (`route.ts`), not a page component, because it needs to perform server-side logic (token exchange, DB writes) before redirecting.
- HMAC validation is critical for security. Use `crypto.timingSafeEqual()` for the comparison to prevent timing attacks. Convert both buffers to the same length before comparing.
- The nonce cookie must be HTTP-only and Secure to prevent client-side JS from reading it. Set `SameSite=Lax` so it survives the Shopify redirect.
- `RUNTIME_SIGNING_SECRET` is reused as the encryption key base for token storage. This avoids adding yet another secret to manage. Key derivation (HKDF with a unique salt) ensures the actual AES key differs from the JWT signing key.
- ScriptTag injection may fail if the merchant's plan does not support it or if there is a rate limit. Treat this as non-fatal — log the error and continue. The merchant can manually embed the widget snippet.
- Re-install flow: when a merchant reinstalls, the existing Integration record is updated (not duplicated). The existing Site record is preserved with all its campaigns and submissions.

### Encryption Implementation Detail

```typescript
// src/lib/encryption.ts
// AES-256-GCM with HKDF-derived key from RUNTIME_SIGNING_SECRET
// Output format: base64(iv):base64(ciphertext):base64(authTag)

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function deriveKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest();
}

export function encrypt(plaintext: string): string { /* ... */ }
export function decrypt(ciphertext: string): string { /* ... */ }
```

### Shopify OAuth Flow Sequence

1. Merchant clicks "Install" in Shopify App Store
2. Shopify sends `GET /auth/shopify-install?shop=store.myshopify.com`
3. App generates nonce, sets cookie, redirects to Shopify OAuth consent screen
4. Merchant approves scopes
5. Shopify redirects to `GET /auth/shopify-callback?code=...&hmac=...&shop=...&state=...`
6. App validates HMAC + nonce, exchanges code for token
7. App encrypts token, stores in Integration model, creates Site, injects ScriptTag
8. App redirects to `/auth/shopify-success?shop=store.myshopify.com`

### Environment Variables

| Variable | Example | Required |
|----------|---------|----------|
| `SHOPIFY_API_KEY` | `abc123def456` | Yes |
| `SHOPIFY_API_SECRET` | `shpss_xxxxxxxxxxxx` | Yes |
| `SHOPIFY_SCOPES` | `read_products,read_customers,write_script_tags,read_orders` | Yes |
| `RUNTIME_SIGNING_SECRET` | (existing) | Yes (reused for encryption key derivation) |

### Project Structure Notes

- New file: `src/lib/encryption.ts`
- New file: `src/lib/shopify.ts`
- New file: `src/app/auth/shopify-install/page.tsx`
- New file: `src/app/auth/shopify-callback/route.ts`
- New file: `src/app/auth/shopify-success/page.tsx`
- Touches: `.env.local` / `.env.local.example` (new Shopify env vars)
- Depends on: `prisma/schema.prisma` Integration model (from G.2)

### Dependencies

- **BLOCKED BY:** G.2 (Integration model — stores encrypted access token in `credentials` field)
- **BLOCKS:** Nothing (Tier 5)
- No external packages required; uses Node.js built-in `crypto` module

### Testing Checklist

- [ ] `encrypt()` / `decrypt()` round-trip returns original plaintext
- [ ] `decrypt()` throws on tampered ciphertext (modified authTag)
- [ ] `decrypt()` throws on tampered IV
- [ ] `buildInstallUrl()` produces valid Shopify OAuth URL with all required params
- [ ] `validateHmac()` returns true for valid Shopify HMAC signature
- [ ] `validateHmac()` returns false for tampered query params
- [ ] Install page rejects missing or malformed `shop` parameter
- [ ] Install page sets HTTP-only nonce cookie
- [ ] Callback rejects request with invalid HMAC (403)
- [ ] Callback rejects request with mismatched nonce (403)
- [ ] Callback exchanges code and stores encrypted token in Integration model
- [ ] Callback creates Site record with correct `platformType: 'shopify'`
- [ ] Callback updates existing Integration on re-install (no duplicate)
- [ ] Callback does not create duplicate Site on re-install
- [ ] ScriptTag injection failure does not block the install flow
- [ ] Success page displays correct shop name and navigation links
- [ ] Missing Clerk session redirects to sign-in

### Error Handling

| Scenario | Response | HTTP Status |
|----------|----------|-------------|
| Missing `shop` param on install | Error page: "Invalid store URL" | 400 |
| Invalid HMAC on callback | Error page: "Installation could not be verified" | 403 |
| Nonce mismatch on callback | Error page: "Session expired, please try again" | 403 |
| Token exchange network error | Error page: "Could not connect to Shopify" | 502 |
| Missing Clerk session | Redirect to `/sign-in?redirect_url=...` | 302 |
| ScriptTag API failure | Log error, continue installation | N/A (non-fatal) |
| Integration model not found (G.2 not deployed) | 500 with clear error message | 500 |

### References

- [Source: Figma Make — pages/auth/shopify-install.tsx, shopify-callback.tsx, shopify-success.tsx]
- [Source: docs/PRD.md#Gate C — Platform Integrations]
- [Source: Shopify OAuth docs — https://shopify.dev/docs/apps/auth/oauth]
- [Source: src/lib/account.ts — withAccountContext() pattern]
- [Source: prisma/schema.prisma — Integration model from G.2]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
