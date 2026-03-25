"use client";

import { Trophy } from "lucide-react";
import Link from "next/link";
import { cn, getInitials } from "@/lib/utils";
import { useSlackFormat } from "@/lib/useSlackFormat";
import CategoryBadge from "./CategoryBadge";

interface LeaderboardTableProps {
  entries: any[];
  showCategory?: boolean;
}

const RANK_CONFIG: Record<number, { icon: string; bg: string; text: string }> = {
  1: {
    icon: "🥇",
    bg: "bg-gradient-to-r from-yellow-100 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/10",
    text: "text-yellow-700 dark:text-yellow-400",
  },
  2: {
    icon: "🥈",
    bg: "bg-gradient-to-r from-gray-100 to-slate-50 dark:from-gray-800/40 dark:to-slate-800/20",
    text: "text-gray-600 dark:text-gray-300",
  },
  3: {
    icon: "🥉",
    bg: "bg-gradient-to-r from-orange-100 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10",
    text: "text-orange-700 dark:text-orange-400",
  },
};

function slackFileUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("https://files.slack.com/")) {
    return `/api/slack/file?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export default function LeaderboardTable({
  entries,
  showCategory = false,
}: LeaderboardTableProps) {
  const fmt = useSlackFormat();

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <Trophy className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p>No entries yet</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <th className="py-3 px-4 w-16">Rank</th>
              <th className="py-3 px-4">Photo</th>
              <th className="py-3 px-4">Submitter</th>
              {showCategory && <th className="py-3 px-4">Category</th>}
              <th className="py-3 px-4 text-right">Votes</th>
              <th className="py-3 px-4 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => {
              const rank = entry.rank ?? idx + 1;
              const photo = entry.photo ?? entry;
              const user = photo.slackPost?.user;
              const config = RANK_CONFIG[rank];
              const votes =
                photo._count?.uniqueVotes ?? photo.uniqueVotes?.length ?? 0;
              const score = photo.finalScore;
              const thumbSrc = slackFileUrl(photo.thumbnailUrl || photo.imageUrl);

              return (
                <tr
                  key={photo.id}
                  className={cn(
                    "border-b border-gray-100 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
                    config?.bg ??
                      (idx % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50/50 dark:bg-gray-800/30")
                  )}
                >
                  <td className="py-3 px-4">
                    {config ? (
                      <span className="text-xl">{config.icon}</span>
                    ) : (
                      <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                        #{rank}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/photo/${photo.id}`} className="flex items-center gap-3 group">
                      <div className="h-10 w-14 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                        {thumbSrc ? (
                          <img src={thumbSrc} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-orange-300 to-rose-400" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium truncate max-w-[200px] group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors",
                          config?.text ?? "text-gray-700 dark:text-gray-300"
                        )}
                      >
                        {fmt(photo.caption ?? photo.slackPost?.caption ?? "Untitled")}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-[9px] font-bold text-white">
                        {user ? getInitials(user.displayName) : "?"}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {user?.displayName ?? "Unknown"}
                      </span>
                    </div>
                  </td>
                  {showCategory && (
                    <td className="py-3 px-4">
                      {entry.category && (
                        <CategoryBadge category={entry.category} size="sm" />
                      )}
                    </td>
                  )}
                  <td className="py-3 px-4 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                    {votes}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {score != null ? (
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        {score.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3 p-3">
        {entries.map((entry, idx) => {
          const rank = entry.rank ?? idx + 1;
          const photo = entry.photo ?? entry;
          const user = photo.slackPost?.user;
          const config = RANK_CONFIG[rank];
          const votes =
            photo._count?.uniqueVotes ?? photo.uniqueVotes?.length ?? 0;
          const score = photo.finalScore;
          const thumbSrc = slackFileUrl(photo.thumbnailUrl || photo.imageUrl);

          return (
            <Link href={`/photo/${photo.id}`} key={photo.id}>
              <div
                className={cn(
                  "rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex gap-3",
                  config?.bg ?? "bg-white dark:bg-gray-900"
                )}
              >
                <div className="h-16 w-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                  {thumbSrc ? (
                    <img src={thumbSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-orange-300 to-rose-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {config ? (
                      <span className="text-lg">{config.icon}</span>
                    ) : (
                      <span className="text-xs font-bold text-gray-400">#{rank}</span>
                    )}
                    <p className={cn("text-sm font-semibold truncate", config?.text ?? "text-gray-800 dark:text-gray-200")}>
                      {fmt(photo.caption ?? photo.slackPost?.caption ?? "Untitled")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="h-4 w-4 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-[7px] font-bold text-white">
                      {user ? getInitials(user.displayName) : "?"}
                    </div>
                    <span className="text-xs text-gray-500">{user?.displayName ?? "Unknown"}</span>
                    <span className="text-xs text-gray-400 ml-auto">{votes} votes</span>
                    {score != null && (
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        {score.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
