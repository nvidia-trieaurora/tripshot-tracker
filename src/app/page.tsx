"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Camera,
  Users,
  Heart,
  Star,
  TrendingUp,
  Loader2,
  Image,
  BarChart3,
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import PhotoCard from "@/components/PhotoCard";
import CountdownTimer from "@/components/CountdownTimer";
import TrendingBadge from "@/components/TrendingBadge";
import { cn } from "@/lib/utils";
import type { ContestStats } from "@/types";

const FLOATING_EMOJIS = ["🏖️", "🌴", "🎉", "✈️", "📸", "🌺", "🐘", "⛱️"];

const QUICK_LINKS = [
  {
    href: "/gallery",
    icon: Image,
    title: "Photo Gallery",
    description: "Browse all submitted photos",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    href: "/leaderboard",
    icon: BarChart3,
    title: "Leaderboard",
    description: "See top-ranked photos",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    href: "/admin",
    icon: Star,
    title: "Admin Panel",
    description: "Manage scores & settings",
    gradient: "from-violet-500 to-purple-500",
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<ContestStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-400 via-rose-400 to-amber-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" />

        {FLOATING_EMOJIS.map((emoji, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 0.25, y: 0 }}
            transition={{ delay: 0.2 + i * 0.12, duration: 0.8 }}
            className="absolute text-3xl sm:text-5xl select-none pointer-events-none"
            style={{
              top: `${10 + ((i * 37) % 70)}%`,
              left: `${5 + ((i * 29) % 85)}%`,
            }}
          >
            {emoji}
          </motion.span>
        ))}

        <div className="relative mx-auto max-w-5xl px-6 py-20 sm:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-5"
          >
            <img
              src="/logo-nvidia.png"
              alt="NVIDIA"
              width={48}
              height={48}
              className="rounded-lg shadow-lg shadow-black/20"
            />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-6xl font-extrabold text-white drop-shadow-lg"
          >
            TripshotTracker 📸
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-4 text-lg sm:text-xl text-white/90 font-medium"
          >
            VRDC Thailand Trip Photo Contest — March 25–27, 2026
          </motion.p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12 py-10">
        {/* Stats */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : stats ? (
          <>
            <section>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Total Photos"
                  value={stats.totalSubmissions}
                  icon={<Camera className="h-5 w-5" />}
                  color="orange"
                />
                <StatsCard
                  title="Participants"
                  value={stats.totalParticipants}
                  icon={<Users className="h-5 w-5" />}
                  color="emerald"
                />
                <StatsCard
                  title="Voters"
                  value={stats.totalVoters}
                  icon={<Heart className="h-5 w-5" />}
                  color="rose"
                />
                <StatsCard
                  title="Reactions"
                  value={stats.totalReactions}
                  icon={<Star className="h-5 w-5" />}
                  color="amber"
                />
              </div>
            </section>

            {/* Countdowns */}
            <section>
              <div className="grid sm:grid-cols-2 gap-4">
                <CountdownTimer
                  targetDate="2026-03-27T17:30:00+07:00"
                  label="⏳ Submissions Close"
                />
                <CountdownTimer
                  targetDate="2026-03-27T18:00:00+07:00"
                  label="🗳️ Voting Deadline"
                />
              </div>
            </section>

            {/* Trending */}
            {stats.topTrending.length > 0 && (
              <section>
                <motion.h2
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-bold text-gray-900 dark:text-white mb-5"
                >
                  🔥 Trending Now
                </motion.h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.topTrending.slice(0, 6).map((photo, i) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <div className="mb-2">
                        <TrendingBadge
                          score={photo.trendingScore ?? 0}
                        />
                      </div>
                      <PhotoCard photo={photo} rank={i + 1} showScore />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <p className="text-center text-gray-500 py-12">
            Failed to load stats. Please try again later.
          </p>
        )}

        {/* Quick Links */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">
            Quick Links
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {QUICK_LINKS.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <Link
                  href={link.href}
                  className="group block rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 hover:shadow-lg transition-all"
                >
                  <div
                    className={cn(
                      "inline-flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br text-white mb-4",
                      link.gradient
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {link.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {link.description}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
