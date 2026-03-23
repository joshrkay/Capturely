"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory?: string;
}

export function CategoryFilter({ categories, selectedCategory }: CategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setCategory = (category?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!category) {
      params.delete("category");
    } else {
      params.set("category", category);
    }

    const next = params.toString();
    router.push(next ? `${pathname}?${next}` : pathname);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setCategory(undefined)}
        className={`rounded border px-3 py-1.5 text-sm ${
          !selectedCategory
            ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
            : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        }`}
      >
        All
      </button>

      {categories.map((category) => {
        const isActive = selectedCategory === category;

        return (
          <button
            key={category}
            type="button"
            onClick={() => setCategory(category)}
            className={`rounded border px-3 py-1.5 text-sm ${
              isActive
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
