# Settings contract (canonical source of truth)

## Why this exists

Settings previously had drift between UI payload keys and API validation keys (for example, `displayName` vs `name`, and `notificationPreferences` vs `notifications`).

This document defines the canonical contract and where it is enforced.

## Canonical domain model

Use `src/lib/settings.ts` as the single settings domain contract.

- `updateSettingsSchema` is the canonical PATCH `/api/settings` request schema.
- `notificationPreferencesSchema` and `defaultNotificationPreferences` are the canonical notification preference model.
- `buildSettingsPatchPayload` is the canonical UI payload builder.
- `deleteAccountSchema` is the canonical DELETE `/api/settings/account` schema.

## Canonical tab model

Use `src/lib/settings-tabs-policy.ts` as the single settings tab key model.

Valid keys:

- `account`
- `team`
- `notifications`
- `api-keys`
- `danger-zone`

The settings tab UI (`src/app/app/settings/components/settings-tabs.tsx`) and any role gating must consume these keys from the policy module rather than introducing ad-hoc key strings.

## End-to-end enforcement points

1. **Client payload generation**
   - `src/app/app/settings/components/notifications-client.ts`
   - Calls `buildSettingsPatchPayload({ notificationPreferences: ... })` before `PATCH /api/settings`.
2. **API parser and persistence**
   - `src/app/api/settings/route.ts`
   - Validates with `updateSettingsSchema` and maps `displayName -> account.name` and `notificationPreferences -> account.notificationPreferencesJson`.
3. **Regression tests**
   - `src/app/app/settings/components/__tests__/notifications-client.test.ts`
   - Asserts the client sends payload accepted by `updateSettingsSchema` and does not send legacy keys.
   - `src/app/api/settings/__tests__/schemas.test.ts`
   - Asserts canonical keys are accepted and legacy keys are rejected.
