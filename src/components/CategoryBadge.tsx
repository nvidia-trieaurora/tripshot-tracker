import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  CATEGORY_EMOJIS,
  type CategoryName,
} from "@/types";

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "md";
}

export default function CategoryBadge({
  category,
  size = "md",
}: CategoryBadgeProps) {
  const key = category as CategoryName;
  const label = CATEGORY_LABELS[key] ?? category;
  const emoji = CATEGORY_EMOJIS[key] ?? "🏷️";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        "bg-orange-50 text-orange-700 border border-orange-200",
        "dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  );
}
