import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/root-layout";
import { Dashboard } from "./pages/dashboard";
import { Templates } from "./pages/templates";
import { Builder } from "./pages/builder";
import { Analytics } from "./pages/analytics";
import { AnalyticsOverview } from "./pages/analytics-overview";
import { Submissions } from "./pages/submissions";
import { Settings } from "./pages/settings";
import { Integrations } from "./pages/integrations";
import { Embed } from "./pages/embed";
import { ShopifyInstall } from "./pages/auth/shopify-install";
import { ShopifyCallback } from "./pages/auth/shopify-callback";
import { ShopifySuccess } from "./pages/auth/shopify-success";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "templates", Component: Templates },
      { path: "builder/:id", Component: Builder },
      { path: "analytics", Component: AnalyticsOverview },
      { path: "analytics/:id", Component: Analytics },
      { path: "submissions/:id", Component: Submissions },
      { path: "integrations", Component: Integrations },
      { path: "embed", Component: Embed },
      { path: "settings", Component: Settings },
    ],
  },
  // Auth flows (outside main layout)
  {
    path: "/auth/shopify",
    Component: ShopifyInstall,
  },
  {
    path: "/auth/shopify/callback",
    Component: ShopifyCallback,
  },
  {
    path: "/auth/shopify/success",
    Component: ShopifySuccess,
  },
]);