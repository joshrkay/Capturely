/**
 * Capturely smoke tests — Gate I
 *
 * These tests verify critical user paths are reachable and render without errors.
 * They use Clerk's test mode; set CLERK_TEST_USER_ID + CLERK_TEST_SESSION_TOKEN
 * in your .env.test to authenticate.
 *
 * Run: npx playwright test
 * Install browsers: npx playwright install chromium
 */
import { test, expect } from "@playwright/test";

// Helper: navigate and assert no crash (no 500, no unhandled errors)
async function assertPageLoads(page: import("@playwright/test").Page, url: string) {
  const response = await page.goto(url);
  expect(response?.status()).not.toBe(500);
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.waitForLoadState("domcontentloaded");
  return errors;
}

test.describe("Public routes", () => {
  test("root page loads", async ({ page }) => {
    const errors = await assertPageLoads(page, "/");
    expect(errors).toHaveLength(0);
  });

  test("sign-in page loads", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).not.toHaveURL(/500/);
  });
});

test.describe("Health check", () => {
  test("DB health endpoint returns 200", async ({ request }) => {
    const res = await request.get("/api/health/db");
    expect(res.status()).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe("ok");
  });
});

// The tests below require an authenticated session.
// In CI, configure PLAYWRIGHT_AUTH_SESSION to inject cookies,
// or use Clerk's testing utilities.
test.describe("Authenticated dashboard routes", () => {
  test.beforeEach(async ({ page }) => {
    // Skip if no auth configured
    if (!process.env.PLAYWRIGHT_AUTH_BYPASS) {
      test.skip();
    }
    // Set auth cookie from env
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await page.context().addCookies(
      JSON.parse(process.env.PLAYWRIGHT_AUTH_COOKIES ?? "[]")
    );
  });

  test("dashboard loads", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("heading")).toBeVisible();
  });

  test("sites page loads and shows create button", async ({ page }) => {
    await page.goto("/app/sites");
    await expect(page.getByRole("link", { name: /add site/i })).toBeVisible();
  });

  test("campaigns page loads", async ({ page }) => {
    await page.goto("/app/campaigns");
    await expect(page.getByRole("heading")).toBeVisible();
  });

  test("billing page loads with plan cards", async ({ page }) => {
    await page.goto("/app/billing");
    // At least one plan card should be visible
    await expect(page.getByText(/free|starter|growth|enterprise/i).first()).toBeVisible();
  });

  test("analytics page loads", async ({ page }) => {
    await page.goto("/app/analytics");
    await expect(page.getByRole("heading")).toBeVisible();
  });

  test("integrations page loads", async ({ page }) => {
    await page.goto("/app/integrations");
    await expect(page.getByText(/shopify/i)).toBeVisible();
  });

  test("settings team invite CTA leads to invite page", async ({ page }) => {
    const response = await page.goto("/app/settings?tab=team");
    expect(response?.status()).not.toBe(404);

    await page.getByRole("link", { name: /invite member/i }).click();
    await expect(page).toHaveURL(/\/app\/settings\/team\/invite$/);
    await expect(page.getByRole("heading", { name: /invite team member/i })).toBeVisible();
    await expect(page).not.toHaveURL(/404/);
  });

});

test.describe("Campaign builder (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.PLAYWRIGHT_AUTH_BYPASS) {
      test.skip();
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await page.context().addCookies(
      JSON.parse(process.env.PLAYWRIGHT_AUTH_COOKIES ?? "[]")
    );
  });

  test("new campaign page shows creation modes", async ({ page }) => {
    await page.goto("/app/campaigns/new");
    // Should offer Manual, Template, and AI creation modes
    await expect(page.getByText(/template/i)).toBeVisible();
    await expect(page.getByText(/ai/i)).toBeVisible();
  });

  test("templates page loads with template cards", async ({ page }) => {
    await page.goto("/app/templates");
    // At least one template card visible
    await expect(page.locator("[data-testid=template-card]").first().or(
      page.getByText(/email capture|welcome|newsletter/i).first()
    )).toBeVisible();
  });
});
