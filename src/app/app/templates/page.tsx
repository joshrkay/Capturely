import Link from "next/link";
import { TEMPLATES, getTemplatesByCategory, getTemplateCategories } from "@/lib/templates";

interface TemplatesPageProps {
  searchParams?: {
    category?: string;
  };
}

export default function TemplatesPage({ searchParams }: TemplatesPageProps) {
  const categories = getTemplateCategories();
  const selectedCategory = searchParams?.category;
  const isAllCategory = !selectedCategory || selectedCategory === "All";
  const hasValidCategory = selectedCategory ? categories.includes(selectedCategory) : false;

  const filteredTemplates = isAllCategory
    ? TEMPLATES
    : hasValidCategory
      ? getTemplatesByCategory(selectedCategory)
      : TEMPLATES;

  return (
    <div className="min-h-full bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Template Library</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
            Browse campaign templates by category and choose a ready-to-use starting point for your next popup or inline
            form.
          </p>
        </header>

        <section className="mb-6">
          <div
            id="template-category-filter"
            data-categories={JSON.stringify(["All", ...categories])}
            data-selected-category={selectedCategory ?? "All"}
            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Filter by category</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/app/templates"
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  isAllCategory
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300"
                }`}
              >
                All
              </Link>
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/app/templates?category=${encodeURIComponent(category)}`}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    selectedCategory === category
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <article
              key={template.id}
              className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-2 inline-flex rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {template.category}
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{template.name}</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{template.description}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
