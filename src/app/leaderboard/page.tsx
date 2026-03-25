"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, Medal, Loader2, Users } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useSlackFormat } from "@/lib/useSlackFormat";

function slackFileUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("https://files.slack.com/")) {
    return `/api/slack/file?url=${encodeURIComponent(url)}`;
  }
  return url;
}
import LeaderboardTable from "@/components/LeaderboardTable";
import ConfettiEffect from "@/components/ConfettiEffect";
import {
  CATEGORY_LABELS,
  CATEGORY_EMOJIS,
  type CategoryName,
} from "@/types";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as CategoryName[];

const PODIUM_GRADIENTS = [
  "from-yellow-400 to-amber-500",
  "from-gray-300 to-slate-400",
  "from-orange-500 to-amber-600",
];

export default function LeaderboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const fmt = useSlackFormat();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const url = selectedCategory
          ? `/api/leaderboard?category=${selectedCategory}`
          : "/api/leaderboard";
        const res = await fetch(url);
        const data = await res.json();
        setEntries(data);

        if (!selectedCategory && data.length > 0) {
          setShowConfetti(true);
        }
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [selectedCategory]);

  const isOverall = selectedCategory === null;
  const top3 = isOverall ? entries.slice(0, 3) : [];
  const remaining = isOverall ? entries.slice(3) : entries;

  // Reorder for podium: [2nd, 1st, 3rd]
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <ConfettiEffect trigger={showConfetti} />

      {/* Hero header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600 py-16 px-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-4xl text-center"
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-lg">
            🏆 Leaderboard
          </h1>
          <p className="mt-3 text-lg text-white/80">
            See who&apos;s capturing the best moments
          </p>
        </motion.div>
      </section>

      {/* Category tabs */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-5xl overflow-x-auto scrollbar-hide">
          <nav className="flex gap-1 px-4 py-3" role="tablist">
            <button
              role="tab"
              aria-selected={isOverall}
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                isOverall
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <Trophy className="inline-block h-4 w-4 mr-1.5 -mt-0.5" />
              Overall
            </button>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                role="tab"
                aria-selected={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  selectedCategory === cat
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {CATEGORY_EMOJIS[cat]} {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className="text-sm">Loading rankings...</p>
          </div>
        ) : entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500"
          >
            <Trophy className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">No entries yet</p>
            <p className="text-sm mt-1">
              Photos will appear here once they&apos;re scored
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory ?? "overall"}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              {/* Podium – Overall only */}
              {isOverall && top3.length > 0 && (
                <section className="mb-12">
                  <div className="flex items-end justify-center gap-4 sm:gap-6 pt-8">
                    {podiumOrder.map((entry, idx) => {
                      const actualRank = entry.rank;
                      const podiumIdx = idx;
                      const isGold = actualRank === 1;
                      const user = entry.slackPost?.user;
                      const votes =
                        entry._count?.uniqueVotes ?? 0;
                      const caption = fmt(
                        entry.caption ??
                        entry.slackPost?.caption ??
                        "Untitled"
                      );

                      return (
                        <Link
                          href={`/photo/${entry.id}`}
                          key={entry.id}
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.5,
                              delay: 0.2 + podiumIdx * 0.15,
                            }}
                            className={cn(
                              "flex flex-col items-center group cursor-pointer",
                              isGold ? "order-2 -mt-6" : podiumIdx === 0 ? "order-1" : "order-3"
                            )}
                          >
                            {/* Rank icon */}
                            <div className="mb-3">
                              {isGold ? (
                                <Crown className="h-8 w-8 text-yellow-400 drop-shadow-lg" />
                              ) : (
                                <Medal
                                  className={cn(
                                    "h-6 w-6",
                                    actualRank === 2
                                      ? "text-gray-400"
                                      : "text-orange-600"
                                  )}
                                />
                              )}
                            </div>

                            {/* Photo */}
                            <div
                              className={cn(
                                "rounded-2xl overflow-hidden shadow-xl group-hover:shadow-2xl transition-all group-hover:scale-105 bg-gray-200 dark:bg-gray-800",
                                isGold
                                  ? "w-36 h-36 sm:w-44 sm:h-44 ring-4 ring-yellow-400/50"
                                  : "w-28 h-28 sm:w-36 sm:h-36"
                              )}
                            >
                              {slackFileUrl(entry.thumbnailUrl || entry.imageUrl) ? (
                                <img
                                  src={slackFileUrl(entry.thumbnailUrl || entry.imageUrl)!}
                                  alt={caption}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className={cn("h-full w-full flex items-center justify-center p-3 bg-gradient-to-br", PODIUM_GRADIENTS[actualRank - 1])}>
                                  <p className="text-white/90 text-xs sm:text-sm font-medium text-center line-clamp-3 drop-shadow">
                                    {caption}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="mt-3 text-center">
                              <div className="flex items-center justify-center gap-1.5 mb-1">
                                {user?.avatarUrl ? (
                                  <img
                                    src={user.avatarUrl}
                                    alt={user.displayName}
                                    className="h-5 w-5 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-[8px] font-bold text-white">
                                    {user ? getInitials(user.displayName) : "?"}
                                  </div>
                                )}
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                                  {user?.displayName ?? "Unknown"}
                                </span>
                              </div>
                              {entry.finalScore != null && (
                                <p className="text-lg font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                                  {entry.finalScore.toFixed(1)}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                                <Users className="h-3 w-3" />
                                {votes} votes
                              </p>
                            </div>
                          </motion.div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Full rankings table */}
              {remaining.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {isOverall ? "Full Rankings" : `${CATEGORY_LABELS[selectedCategory as CategoryName]} Rankings`}
                  </h2>
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                    <LeaderboardTable
                      entries={remaining}
                      showCategory={!isOverall}
                    />
                  </div>
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
