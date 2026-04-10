import Link from "next/link";

const featureHighlights = [
  {
    title: "Drag-and-drop builder",
    description:
      "Launch polished popups and embedded forms with no custom code or designer handoff.",
  },
  {
    title: "Conditional logic",
    description:
      "Show the right next question based on every shopper action so each flow feels personalized.",
  },
  {
    title: "Integrations",
    description:
      "Sync leads to Shopify, webhooks, and your stack in real time without manual exports.",
  },
  {
    title: "Analytics",
    description:
      "Track impressions, submissions, and winning variants to optimize every campaign.",
  },
];

const pricingTiers = [
  { name: "Free", price: "$0/mo", subtitle: "For trying Capturely" },
  { name: "Starter", price: "$19/mo", subtitle: "For early stores" },
  { name: "Growth", price: "$49/mo", subtitle: "For scaling teams" },
  { name: "Enterprise", price: "Custom pricing", subtitle: "For high volume" },
];

const socialProof = [
  "Trusted by growth teams",
  "Used by Shopify brands across beauty, wellness, and apparel",
  "4.9/5 average onboarding satisfaction",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#e5edff_0%,_#f8fafc_50%,_#fff7ed_100%)] text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-14 sm:px-10 lg:px-12">
        <section className="rounded-3xl border border-slate-200/70 bg-white/85 p-8 shadow-xl shadow-slate-300/30 backdrop-blur sm:p-12">
          <p className="text-sm font-semibold tracking-[0.22em] text-sky-700 uppercase">Capturely</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Build high-converting Shopify forms in minutes
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-700 sm:text-xl">
            Design, target, and optimize lead forms that turn visitors into subscribers and buyers.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="https://apps.shopify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-sky-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
            >
              Start on Shopify App Store
            </Link>
            <p className="text-sm text-slate-600">No credit card required to start</p>
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-2">
          {featureHighlights.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-lg shadow-slate-200/30"
            >
              <h2 className="text-xl font-semibold">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">{feature.description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-slate-300/20 sm:p-10">
          <h2 className="text-3xl font-semibold tracking-tight">Pricing</h2>
          <p className="mt-2 text-slate-700">Simple plans that match every stage of growth.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pricingTiers.map((tier) => (
              <article key={tier.name} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <p className="mt-2 text-2xl font-bold text-slate-900">{tier.price}</p>
                <p className="mt-2 text-sm text-slate-600">{tier.subtitle}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-slate-900 p-8 text-slate-100 shadow-xl shadow-slate-500/20 sm:p-10">
          <h2 className="text-2xl font-semibold">Social proof</h2>
          <ul className="mt-5 grid gap-3 text-sm sm:text-base">
            {socialProof.map((item) => (
              <li key={item} className="rounded-xl bg-slate-800/70 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
