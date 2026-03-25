import Link from "next/link";
import { Logo } from "@/components/logo";

const features = [
  {
    title: "AI Form Builder",
    description:
      "Describe what you want to capture and our AI builds the perfect form in seconds. No drag-and-drop needed.",
    icon: (
      <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
  },
  {
    title: "Auto-Optimization",
    description:
      "Capturely automatically generates variant forms, runs A/B tests, and promotes winners. Your conversion rate improves on autopilot.",
    icon: (
      <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    title: "Shopify Native",
    description:
      "One-click install for Shopify stores. Widget loads instantly with zero impact on page speed. Works with WordPress and custom sites too.",
    icon: (
      <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
      </svg>
    ),
  },
  {
    title: "Real-Time Analytics",
    description:
      "Track submissions, conversion rates, and variant performance across all your campaigns in one dashboard.",
    icon: (
      <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
      </svg>
    ),
  },
];

const steps = [
  { step: "1", title: "Describe", description: "Tell the AI what you want to capture — leads, feedback, signups, surveys." },
  { step: "2", title: "AI Builds", description: "Get a production-ready form in seconds. Customize fields, style, and triggers." },
  { step: "3", title: "Auto-Optimizes", description: "Capturely generates variants, tests them, and promotes winners automatically." },
];

const plans = [
  { name: "Free", price: "$0", period: "/mo", submissions: "100", sites: "1", highlight: false },
  { name: "Starter", price: "$19", period: "/mo", submissions: "1,000", sites: "3", highlight: false },
  { name: "Growth", price: "$49", period: "/mo", submissions: "10,000", sites: "10", highlight: true },
  { name: "Enterprise", price: "Custom", period: "", submissions: "Unlimited", sites: "Unlimited", highlight: false },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo size="md" />
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-24 pt-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
          AI-Powered Form Builder
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
          Forms that build themselves.
          <br />
          <span className="text-indigo-600 dark:text-indigo-400">Then optimize themselves.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Describe what you want to capture. Capturely&apos;s AI builds the form, then automatically
          generates variants, runs A/B tests, and promotes winners to maximize your conversion rate.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Start Building Free
          </Link>
          <Link
            href="#how-it-works"
            className="rounded-lg border border-zinc-300 px-6 py-3 text-base font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            See How It Works
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-24 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Everything you need to capture and convert
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-600 dark:text-zinc-400">
            From AI-generated forms to automatic optimization, Capturely handles the entire conversion funnel.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Three steps to higher conversions
          </h2>
          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                  {s.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{s.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-24 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-zinc-600 dark:text-zinc-400">
            Start free, upgrade when you need more. No credit card required.
          </p>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 ${
                  plan.highlight
                    ? "border-indigo-600 bg-white ring-2 ring-indigo-600 dark:border-indigo-500 dark:bg-zinc-950 dark:ring-indigo-500"
                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                }`}
              >
                {plan.highlight && (
                  <div className="mb-3 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{plan.price}</span>
                  <span className="text-sm text-zinc-500">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>{plan.submissions} submissions/mo</li>
                  <li>{plan.sites} site{plan.sites !== "1" ? "s" : ""}</li>
                </ul>
                <Link
                  href="/sign-up"
                  className={`mt-6 block rounded-lg px-4 py-2 text-center text-sm font-medium ${
                    plan.highlight
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Ready to build forms that convert?
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Join merchants using AI-powered forms that optimize themselves.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-block rounded-lg bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Start Building Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-12 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <Logo size="sm" />
          <p className="text-sm text-zinc-500">&copy; {new Date().getFullYear()} Capturely. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
