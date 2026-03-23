"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { getTemplateCategories } from "@/lib/templates";

type TemplateCategories = ReturnType<typeof getTemplateCategories>;

interface CategoryFilterProps {
  currentCategory?: string;
  categories: TemplateCategories;
}

const baseButtonClass =
  "rounded border px-3 py-1.5 text-sm transition-colors";

const selectedButtonClass =
  "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-500 dark:text-zinc-950";

const unselectedButtonClass =
  "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900";

export function CategoryFilter({ currentCategory, categories }: CategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateCategory = (category?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!category) {
      params.delete("category");
    } else {
      params.set("category", category);
    }

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    router.push(url, { scroll: false });
  };

  const resolveButtonClass = (isSelected: boolean) =>
    `${baseButtonClass} ${isSelected ? selectedButtonClass : unselectedButtonClass}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => updateCategory()}
        className={resolveButtonClass(!currentCategory)}
        aria-pressed={!currentCategory}
      >
        All
      </button>

      {categories.map((category) => {
        const isSelected = currentCategory === category;

        return (
          <button
            key={category}
            type="button"
            onClick={() => updateCategory(category)}
            className={resolveButtonClass(isSelected)}
            aria-pressed={isSelected}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
