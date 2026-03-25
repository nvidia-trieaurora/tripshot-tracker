import { cn } from "@/lib/utils";

interface TrendingBadgeProps {
  score: number;
}

export default function TrendingBadge({ score }: TrendingBadgeProps) {
  if (score <= 50) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
        "bg-red-50 text-red-600 border border-red-200",
        "dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
        "animate-pulse"
      )}
    >
      🔥 Trending
    </span>
  );
}
