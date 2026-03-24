"use client";

import { useState } from "react";
import Link from "next/link";

export default function ShopifyConnectPage() {
  const [shop, setShop] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    let domain = shop.trim();
    // If user enters just the store name, append .myshopify.com
    if (!domain.includes(".")) {
      domain = `${domain}.myshopify.com`;
    }

    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(domain)) {
      setError(
        "Please enter a valid Shopify store domain (e.g., my-store.myshopify.com)"
      );
      return;
    }

    setLoading(true);
    window.location.href = `/api/integrations/shopify/auth?shop=${encodeURIComponent(domain)}`;
  }

  return (
    <div className="mx-auto max-w-md">
      <Link
        href="/app/integrations"
        className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
      >
        &larr; Back to Integrations
      </Link>

      <h2 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Connect Shopify
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Enter your Shopify store domain to start the connection. This will
        redirect you to Shopify to authorize the Capturely app.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="shop-domain"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Store Domain
          </label>
          <div className="mt-1 flex items-center">
            <input
              id="shop-domain"
              type="text"
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              placeholder="my-store.myshopify.com"
              className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              required
            />
          </div>
          {error && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Redirecting to Shopify..." : "Connect to Shopify"}
        </button>
      </form>
    </div>
  );
}
