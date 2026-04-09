import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Capturely",
  description: "Privacy policy for the Capturely Shopify app.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-16 text-slate-900">
      <article className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-sm text-slate-600">Last updated: March 31, 2026</p>
        <p className="mt-6 text-base leading-7 text-slate-700">
          This policy explains how Capturely collects, uses, stores, and protects information when
          merchants use the Capturely Shopify app at https://app.capturely.io/privacy-policy.
        </p>

        <section className="mt-10 space-y-3">
          <h2 className="text-2xl font-semibold">What We Collect</h2>
          <p className="leading-7 text-slate-700">
            We collect account details needed to provide the app, including merchant and store
            identifiers from Shopify, app configuration data, analytics events, and form submission
            records created by merchants through Capturely.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-2xl font-semibold">How We Store and Protect Data</h2>
          <p className="leading-7 text-slate-700">
            Data is stored in managed cloud infrastructure with access controls, encryption in
            transit, and operational monitoring. Access is limited to authorized personnel for
            support, security, and service reliability purposes.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-2xl font-semibold">How We Use Shopify Data</h2>
          <p className="leading-7 text-slate-700">
            Shopify data is used only to power app functionality requested by the merchant, such as
            connecting forms to stores, processing submissions, and providing app analytics. We do
            not sell Shopify merchant data.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-2xl font-semibold">GDPR and Privacy Rights</h2>
          <p className="leading-7 text-slate-700">
            Merchants and data subjects can request access, correction, deletion, or export of
            personal data where applicable. We support Shopify privacy webhooks and applicable legal
            obligations for data subject rights.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-2xl font-semibold">Contact</h2>
          <p className="leading-7 text-slate-700">
            For privacy questions or requests, contact us at{" "}
            <a className="font-medium text-sky-700 hover:text-sky-800" href="mailto:privacy@capturely.io">
              privacy@capturely.io
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
