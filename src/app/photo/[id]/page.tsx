"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  Users,
  Heart,
  Loader2,
  Share2,
  Download,
  ChevronDown,
  Eye,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import { cn, getInitials, truncate } from "@/lib/utils";
import { useSlackFormat } from "@/lib/useSlackFormat";
import ReactionBreakdown from "@/components/ReactionBreakdown";
import ScoringPanel from "@/components/ScoringPanel";
import CategoryBadge from "@/components/CategoryBadge";
import TrendingBadge from "@/components/TrendingBadge";
import PhotoCard from "@/components/PhotoCard";
import type {
  PhotoWithDetails,
  ReactionBreakdown as ReactionBreakdownType,
  CategoryName,
} from "@/types";

const PLACEHOLDER_GRADIENTS = [
  "from-orange-400 to-rose-500",
  "from-violet-400 to-purple-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-pink-400 to-rose-500",
];

export default function PhotoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const fmt = useSlackFormat();
  const [photo, setPhoto] = useState<
    PhotoWithDetails & { reactionBreakdown?: ReactionBreakdownType[] }
  >();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votersExpanded, setVotersExpanded] = useState(false);
  const [relatedPhotos, setRelatedPhotos] = useState<any[]>([]);

  const fetchPhoto = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/photos/${id}`);
      if (!res.ok) throw new Error("Photo not found");
      const data = await res.json();
      setPhoto(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load photo");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPhoto();
  }, [fetchPhoto]);

  useEffect(() => {
    if (!photo?.slackPost?.user?.slackId) return;
    const fetchRelated = async () => {
      try {
        const res = await fetch("/api/photos");
        if (!res.ok) return;
        const all = await res.json();
        const related = all.filter(
          (p: any) =>
            p.slackPost?.user?.slackId === photo.slackPost.user.slackId &&
            p.id !== photo.id
        );
        setRelatedPhotos(related.slice(0, 6));
      } catch {
        // silently ignore
      }
    };
    fetchRelated();
  }, [photo?.slackPost?.user?.slackId, photo?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-sm">Loading photo...</p>
        </div>
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-6xl">📷</div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          {error ?? "Photo not found"}
        </h2>
        <Link
          href="/gallery"
          className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Gallery
        </Link>
      </div>
    );
  }

  const caption = fmt(
    photo.caption ?? photo.slackPost?.caption ?? "Untitled photo"
  );
  const user = photo.slackPost?.user;
  const votes = photo._count?.uniqueVotes ?? photo.uniqueVotes?.length ?? 0;
  const totalReactions =
    photo._count?.reactions ?? photo.reactions?.length ?? 0;
  let categories: CategoryName[] = [];
  if (photo.categoryTags) {
    try {
      const parsed = JSON.parse(photo.categoryTags);
      categories = Array.isArray(parsed) ? parsed : [];
    } catch {
      categories = photo.categoryTags.split(",").filter(Boolean) as CategoryName[];
    }
  }
  const gradientIdx =
    Math.abs(
      (photo.id ?? "").charCodeAt(0) + ((photo.id ?? "").charCodeAt(1) || 0)
    ) % PLACEHOLDER_GRADIENTS.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Back button */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link
            href="/gallery"
            className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Gallery
          </Link>
          <a
            href={photo?.imageUrl?.startsWith("https://files.slack.com/") ? `/api/slack/file?url=${encodeURIComponent(photo.imageUrl)}` : photo?.imageUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row gap-8"
        >
          {/* Photo/Video display */}
          <div className="flex-1 lg:flex-[2]">
            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gray-200 dark:bg-gray-800">
              {photo.mediaType === "video" ? (
                <video
                  src={photo.imageUrl?.startsWith("https://files.slack.com/") ? `/api/slack/file?url=${encodeURIComponent(photo.imageUrl)}` : photo.imageUrl}
                  controls
                  className="w-full aspect-video object-contain bg-black"
                  poster={photo.thumbnailUrl?.startsWith("https://files.slack.com/") ? `/api/slack/file?url=${encodeURIComponent(photo.thumbnailUrl)}` : undefined}
                />
              ) : (
                <img
                  src={photo.imageUrl?.startsWith("https://files.slack.com/") ? `/api/slack/file?url=${encodeURIComponent(photo.imageUrl)}` : photo.imageUrl}
                  alt={caption}
                  className="w-full aspect-auto max-h-[600px] object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.parentElement!.classList.add("aspect-[4/3]", "bg-gradient-to-br", "from-orange-400", "to-rose-500");
                    const fallback = document.createElement("p");
                    fallback.className = "absolute inset-0 flex items-center justify-center text-white/90 text-center text-lg font-medium p-8";
                    fallback.textContent = caption;
                    target.parentElement!.appendChild(fallback);
                  }}
                />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6">
                <p className="text-white text-sm font-medium drop-shadow line-clamp-2">
                  {truncate(caption, 200)}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:flex-1 space-y-6">
            {/* Submitter info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="h-12 w-12 rounded-full object-cover shadow-md"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-lg font-bold text-white shadow-md">
                    {user ? getInitials(user.displayName) : "?"}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {user?.displayName ?? "Unknown"}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(
                      new Date(photo.slackPost?.postedAt ?? photo.createdAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                </div>
              </div>

              {/* Slack link */}
              {photo.slackPost?.slackPermalink && (
                <a
                  href={photo.slackPost.slackPermalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors mb-4"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on Slack
                </a>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-center">
                  <Users className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {votes}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Unique Voters
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-center">
                  <Heart className="h-4 w-4 mx-auto mb-1 text-rose-500" />
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {totalReactions}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Reactions
                  </p>
                </div>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <CategoryBadge key={cat} category={cat} size="sm" />
                  ))}
                </div>
              )}

              {/* Trending */}
              {photo.trendingScore != null && (
                <div className="mt-3">
                  <TrendingBadge score={photo.trendingScore} />
                </div>
              )}

              {/* Final Score - photos only */}
              {photo.finalScore != null && photo.mediaType !== "video" && (
                <div className="mt-4 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 p-4 text-center shadow-lg shadow-orange-500/20">
                  <p className="text-xs font-medium text-white/80 uppercase tracking-wider flex items-center justify-center gap-1">
                    <Star className="h-3 w-3" />
                    Final Score
                  </p>
                  <p className="text-4xl font-extrabold text-white mt-1">
                    {photo.finalScore.toFixed(1)}
                  </p>
                </div>
              )}
            </motion.div>
          </aside>
        </motion.div>

        {/* Reactions */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            Reactions
          </h3>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <ReactionBreakdown
              reactions={photo.reactionBreakdown ?? []}
            />
          </div>
        </motion.section>

        {/* Voters list */}
        {(photo.voters || photo.uniqueVotes) && (photo.voters?.length || photo.uniqueVotes?.length) > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-6"
          >
            <button
              onClick={() => setVotersExpanded(!votersExpanded)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Eye className="h-4 w-4" />
              {votes} Unique Voter{votes !== 1 ? "s" : ""}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  votersExpanded && "rotate-180"
                )}
              />
            </button>
            <AnimatePresence>
              {votersExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                    <div className="flex flex-wrap gap-2">
                      {(photo.voters || photo.uniqueVotes || []).map((v: any) => (
                        <span
                          key={v.slackUserId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        >
                          <span className="h-5 w-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                            {getInitials(v.displayName || v.slackUserId)}
                          </span>
                          {v.displayName || v.slackUserId}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* Organizer Scoring - photos only */}
        {photo.mediaType !== "video" && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <ScoringPanel
              photoId={photo.id}
              initialScores={
                photo.organizerCreativity != null
                  ? {
                      creativity: photo.organizerCreativity,
                      emotion: photo.organizerEmotion ?? 5,
                      storytelling: photo.organizerStorytelling ?? 5,
                      notes: photo.organizerNotes ?? "",
                    }
                  : undefined
              }
              initialCategories={categories}
              onSave={fetchPhoto}
            />
          </motion.section>
        )}

        {/* Related photos */}
        {relatedPhotos.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              More from {user?.displayName ?? "this submitter"}
            </h3>
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-4" style={{ minWidth: "max-content" }}>
                {relatedPhotos.map((rp) => (
                  <div key={rp.id} className="w-56 shrink-0">
                    <PhotoCard photo={rp} showScore />
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
