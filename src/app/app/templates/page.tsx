import {
  TEMPLATES,
  getTemplateCategories,
  getTemplatesByCategory,
} from "@/lib/templates";
import { CategoryFilter } from "./components/category-filter";
import { TemplatesGrid } from "./components/templates-grid";

interface TemplatesPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  const params = await searchParams;
  const categories = getTemplateCategories();
  const selectedCategory = params.category;
  const activeCategory = selectedCategory && categories.includes(selectedCategory)
    ? selectedCategory
    : undefined;

  const templates = activeCategory ? getTemplatesByCategory(activeCategory) : TEMPLATES;

  return (
    <div className="space-y-6 bg-zinc-50 dark:bg-black">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Templates</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Browse pre-built forms and launch your next campaign in minutes.
        </p>
      </div>

      <CategoryFilter categories={categories} selectedCategory={activeCategory} />

      <TemplatesGrid templates={templates} />
    </div>
  );
}
