"use client";

import { useState, useEffect } from "react";
import {
  generateGenericSnippet,
  generateShopifySnippet,
  generateWordPressSnippet,
  generateGTMSnippet,
} from "@/lib/embed-utils";

interface Site {
  id: string;
  name: string;
  primaryDomain: string;
  publicKey: string;
}

const tabs = [
  { key: "generic", label: "Generic JS" },
  { key: "shopify", label: "Shopify" },
  { key: "wordpress", label: "WordPress" },
  { key: "gtm", label: "Google Tag Manager" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const tabInstructions: Record<TabKey, string> = {
  generic:
    "Add this script tag before the closing </head> tag on every page where you want Capturely to run.",
  shopify:
    'In your Shopify admin, go to Online Store > Themes > Edit Code, then paste this before </head> in theme.liquid.',
  wordpress:
    "Add this snippet to your theme's functions.php file or use a plugin like Insert Headers and Footers.",
  gtm: "In Google Tag Manager, create a new Tag with type Custom HTML, paste the snippet below, and set the trigger to All Pages.",
};

function getSnippet(tab: TabKey, publicKey: string): string {
  switch (tab) {
    case "generic":
      return generateGenericSnippet(publicKey);
    case "shopify":
      return generateShopifySnippet(publicKey);
    case "wordpress":
      return generateWordPressSnippet(publicKey);
    case "gtm":
      return generateGTMSnippet(publicKey);
  }
}

export default function EmbedPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabKey>("generic");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => r.json())
      .then((data: { sites: Site[] }) => {
        setSites(data.sites ?? []);
        if (data.sites?.length > 0) {
          setSelectedSiteId(data.sites[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selectedSite = sites.find((s) => s.id === selectedSiteId);

  async function handleCopy() {
    if (!selectedSite) return;
    const snippet = getSnippet(activeTab, selectedSite.publicKey);
    try {
      await navigator.clipboard.writeText(snippet);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = snippet;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-zinc-500 dark:text-zinc-400">
        Loading sites...
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Embed Widget
        </h2>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          You need to create a site first before you can get embed code.{" "}
          <a
            href="/app/sites"
            className="text-indigo-600 underline dark:text-indigo-400"
          >
            Create a site
          </a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Embed Widget
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Install the Capturely widget on your site to start capturing leads.
      </p>

      {/* Site selector */}
      <div className="mt-6">
        <label
          htmlFor="site-select"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Select Site
        </label>
        <select
          id="site-select"
          value={selectedSiteId}
          onChange={(e) => setSelectedSiteId(e.target.value)}
          className="mt-1 block w-full max-w-md rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name} ({site.primaryDomain})
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-zinc-200 dark:border-zinc-800">
        <nav className="-mb-px flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Instructions + snippet */}
      {selectedSite && (
        <div className="mt-6">
          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
            {tabInstructions[activeTab]}
          </p>
          <div className="relative">
            <pre className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              {getSnippet(activeTab, selectedSite.publicKey)}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute right-3 top-3 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              {copyState === "copied" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
