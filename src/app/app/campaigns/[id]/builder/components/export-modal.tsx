"use client";

import { useEffect, useMemo, useState } from "react";
import {
  generateGenericSnippet,
  generateGTMSnippet,
  generateShopifySnippet,
  generateWordPressSnippet,
} from "@/lib/embed-utils";
import { UnpublishedChangesBadge } from "../../../components/unpublished-changes-badge";

type ExportTab = "generic" | "shopify" | "wordpress" | "gtm";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => Promise<boolean>;
  publishing: boolean;
  campaign: {
    id: string;
    status: string;
    hasUnpublishedChanges: boolean;
    site?: { publicKey?: string; id: string; name: string };
  };
}

function copyWithFallback(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("Document is unavailable"));
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();

    try {
      const copied = document.execCommand("copy");
      if (!copied) {
        reject(new Error("Copy command failed"));
        return;
      }
      resolve();
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Unable to copy"));
    } finally {
      document.body.removeChild(textArea);
    }
  });
}

export function ExportModal({ isOpen, onClose, onPublish, publishing, campaign }: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<ExportTab>("generic");
  const [copyState, setCopyState] = useState<Record<ExportTab, "idle" | "copied" | "error">>({
    generic: "idle",
    shopify: "idle",
    wordpress: "idle",
    gtm: "idle",
  });
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const publicKey = campaign.site?.publicKey;

  const snippets = useMemo(() => {
    if (!publicKey) {
      return {
        generic: "",
        shopify: "",
        wordpress: "",
        gtm: "",
      };
    }

    return {
      generic: generateGenericSnippet(publicKey),
      shopify: generateShopifySnippet(publicKey),
      wordpress: generateWordPressSnippet(publicKey),
      gtm: generateGTMSnippet(publicKey),
    };
  }, [publicKey]);

  const tabContent = {
    generic: {
      label: "Generic HTML",
      instructions: "Paste this snippet where your site should load Capturely (typically before </body>).",
      snippet: snippets.generic,
    },
    shopify: {
      label: "Shopify",
      instructions: "In Online Store > Themes > Edit Code, add this snippet before </head> in theme.liquid.",
      snippet: snippets.shopify,
    },
    wordpress: {
      label: "WordPress",
      instructions: "Add this to functions.php (or via Code Snippets plugin) to inject the script in wp_head.",
      snippet: snippets.wordpress,
    },
    gtm: {
      label: "Google Tag Manager",
      instructions: "Create a Tag > Custom HTML with this snippet and use the All Pages trigger.",
      snippet: snippets.gtm,
    },
  } as const;

  const statusBadge = (() => {
    if (campaign.hasUnpublishedChanges) {
      return <UnpublishedChangesBadge />;
    }

    if (campaign.status === "published") {
      return (
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          Published
          {lastPublishedAt ? ` • ${new Date(lastPublishedAt).toLocaleString()}` : ""}
        </span>
      );
    }

    return <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">Draft — not yet published</span>;
  })();

  const handleCopy = async (tab: ExportTab) => {
    const snippet = tabContent[tab].snippet;
    if (!snippet) return;

    try {
      await copyWithFallback(snippet);
      setCopyState((prev) => ({ ...prev, [tab]: "copied" }));
      setTimeout(() => {
        setCopyState((prev) => ({ ...prev, [tab]: "idle" }));
      }, 2000);
    } catch {
      setCopyState((prev) => ({ ...prev, [tab]: "error" }));
      setTimeout(() => {
        setCopyState((prev) => ({ ...prev, [tab]: "idle" }));
      }, 2000);
    }
  };

  const handlePublishClick = async () => {
    const success = await onPublish();
    if (success) {
      setLastPublishedAt(new Date().toISOString());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Export and publish campaign"
        className="relative w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900"
          aria-label="Close export modal"
        >
          ✕
        </button>

        <div className="mb-4 pr-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Publish & Install</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Get your embed code and publish this campaign.</p>
          <div className="mt-2 flex items-center gap-2">{statusBadge}</div>
        </div>

        {!publicKey ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
            This campaign is missing a site public key, so embed snippets cannot be generated.
          </div>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-1 border-b border-zinc-200 pb-2 dark:border-zinc-800">
              {(Object.keys(tabContent) as ExportTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                    activeTab === tab
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                >
                  {tabContent[tab].label}
                </button>
              ))}
            </div>

            <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-300">{tabContent[activeTab].instructions}</p>
            <div className="rounded-lg bg-zinc-900 p-3">
              <pre className="overflow-x-auto text-sm text-zinc-100">
                <code className="font-mono">{tabContent[activeTab].snippet}</code>
              </pre>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <a
                href={`/manifests/${publicKey}.json`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                Open published manifest preview ↗
              </a>
              <button
                type="button"
                onClick={() => handleCopy(activeTab)}
                className="rounded border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                {copyState[activeTab] === "copied"
                  ? "Copied!"
                  : copyState[activeTab] === "error"
                    ? "Copy failed"
                    : "Copy code"}
              </button>
            </div>
          </>
        )}

        <div className="mt-5 flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePublishClick}
            disabled={publishing}
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {publishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
