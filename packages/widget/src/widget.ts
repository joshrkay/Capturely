/**
 * Capturely Widget — embeddable form loader.
 *
 * Usage: <script src="/widget.js" data-public-key="pk_xxx"></script>
 *
 * Flow:
 * 1. Read data-public-key from the script tag
 * 2. Fetch manifest from /api/manifests/{publicKey}
 * 3. For each campaign: evaluate URL targeting, set up trigger
 * 4. When trigger fires: check frequency, render popup or inline form
 * 5. On submit: request token, POST submission
 */

import type { SiteManifestV1, ManifestCampaign, FormSchema } from "@capturely/shared-forms";
import { matchesTargeting } from "./targeting";
import { setupTrigger } from "./triggers";
import { shouldShow, recordShow } from "./frequency";
import { createPopup } from "./popup";
import { renderForm } from "./form-renderer";

let initialized = false;

function getPublicKey(): string | null {
  const script = document.currentScript as HTMLScriptElement | null;
  if (script) {
    return script.getAttribute("data-public-key");
  }
  // Fallback: find the script by src
  const scripts = document.querySelectorAll("script[data-public-key]");
  const last = scripts[scripts.length - 1] as HTMLElement | undefined;
  return last?.getAttribute("data-public-key") ?? null;
}

function getBaseUrl(): string {
  const script = document.currentScript as HTMLScriptElement | null;
  if (script?.src) {
    const url = new URL(script.src);
    return url.origin;
  }
  return "";
}

function generateSubmissionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function fetchManifest(baseUrl: string, publicKey: string): Promise<SiteManifestV1 | null> {
  try {
    const res = await fetch(`${baseUrl}/api/manifests/${publicKey}`);
    if (!res.ok) return null;
    return (await res.json()) as SiteManifestV1;
  } catch {
    return null;
  }
}

async function requestToken(baseUrl: string, publicKey: string): Promise<string | null> {
  try {
    const res = await fetch(`${baseUrl}/api/runtime/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicKey }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { token: string };
    return data.token;
  } catch {
    return null;
  }
}

async function submitForm(
  baseUrl: string,
  token: string,
  payload: {
    publicKey: string;
    campaignId: string;
    variantId: string;
    submissionId: string;
    fields: Record<string, string>;
  }
): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/runtime/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function selectVariant(campaign: ManifestCampaign): { variantId: string; schema: FormSchema } | null {
  const variantIds = Object.keys(campaign.variants);
  if (variantIds.length === 0) return null;

  // For now, always select the first variant (control).
  // GrowthBook SDK will handle proper variant assignment in Gate D.
  const variantId = variantIds[0];
  return { variantId, schema: campaign.variants[variantId] };
}

function handleCampaign(baseUrl: string, publicKey: string, campaign: ManifestCampaign): () => void {
  const currentUrl = window.location.href;

  if (!matchesTargeting(campaign.targeting, currentUrl)) {
    return () => {};
  }

  if (!shouldShow(campaign.campaignId, campaign.frequency)) {
    return () => {};
  }

  const cleanup = setupTrigger(campaign.trigger, () => {
    const selected = selectVariant(campaign);
    if (!selected) return;

    recordShow(campaign.campaignId);

    const submissionId = generateSubmissionId();

    const handleSubmit = async (fields: Record<string, string>) => {
      const token = await requestToken(baseUrl, publicKey);
      if (!token) {
        console.error("[Capturely] Failed to get submission token");
        return;
      }

      await submitForm(baseUrl, token, {
        publicKey,
        campaignId: campaign.campaignId,
        variantId: selected.variantId,
        submissionId,
        fields,
      });
    };

    if (campaign.type === "popup") {
      const popup = createPopup(selected.schema, () => {});
      renderForm({
        schema: selected.schema,
        container: popup.formContainer,
        onSubmit: (fields) => {
          handleSubmit(fields);
          popup.destroy();
        },
      });
    }
    // Inline rendering would target a specific DOM element — deferred until builder specifies container
  });

  return cleanup;
}

function init() {
  if (initialized) return;
  initialized = true;

  const publicKey = getPublicKey();
  if (!publicKey) {
    console.error("[Capturely] No data-public-key found on script tag");
    return;
  }

  const baseUrl = getBaseUrl();

  fetchManifest(baseUrl, publicKey).then((manifest) => {
    if (!manifest) {
      console.error("[Capturely] Failed to load manifest");
      return;
    }

    const cleanups: Array<() => void> = [];
    for (const campaign of manifest.campaigns) {
      cleanups.push(handleCampaign(baseUrl, publicKey, campaign));
    }

    // Expose cleanup for SPA navigation
    (window as unknown as Record<string, unknown>).__capturely_cleanup = () => {
      cleanups.forEach((fn) => fn());
    };
  });
}

// Auto-init when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
