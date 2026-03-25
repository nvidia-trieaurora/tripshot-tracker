"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
}

const COLOR_MAP: Record<string, string> = {
  orange: "from-orange-400 to-amber-500",
  amber: "from-amber-400 to-yellow-500",
  rose: "from-rose-400 to-pink-500",
  emerald: "from-emerald-400 to-teal-500",
  violet: "from-violet-400 to-purple-500",
};

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  color = "orange",
}: StatsCardProps) {
  const gradient = COLOR_MAP[color] ?? COLOR_MAP.orange;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative rounded-2xl p-[1px] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800"
    >
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-5">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br text-white",
              gradient
            )}
          >
            {icon}
          </div>
          {trend && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
              {trend}
            </span>
          )}
        </div>
        <p className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{title}</p>
      </div>
    </motion.div>
  );
}
