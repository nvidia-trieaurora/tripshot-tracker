"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Play, Download } from "lucide-react";
import { motion } from "framer-motion";
import { cn, getInitials, truncate } from "@/lib/utils";
import { useSlackFormat } from "@/lib/useSlackFormat";

interface PhotoCardProps {
  photo: any;
  rank?: number;
  showScore?: boolean;
  onSelect?: () => void;
}

const RANK_STYLES: Record<number, string> = {
  1: "bg-gradient-to-br from-yellow-400 to-amber-500 text-white",
  2: "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800",
  3: "bg-gradient-to-br from-orange-600 to-amber-700 text-white",
};

function slackFileUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("https://files.slack.com/")) {
    return `/api/slack/file?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export default function PhotoCard({
  photo,
  rank,
  showScore,
  onSelect,
}: PhotoCardProps) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const fmt = useSlackFormat();

  const caption = fmt(
    photo.caption ?? photo.slackPost?.caption ?? "Untitled photo"
  );
  const user = photo.slackPost?.user;
  const uniqueVotes = photo._count?.uniqueVotes ?? photo.uniqueVotes?.length ?? 0;
  const reactionCount = photo._count?.reactions ?? photo.reactions?.length ?? 0;
  const isVideo = photo.mediaType === "video";

  const thumbnailSrc = slackFileUrl(photo.thumbnailUrl);
  const imageSrc = slackFileUrl(photo.imageUrl);
  const displaySrc = thumbnailSrc || (isVideo ? null : imageSrc);

  const handleClick = () => {
    if (onSelect) onSelect();
    router.push(`/photo/${photo.id}`);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={handleClick}
      className="group relative cursor-pointer rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl transition-shadow border border-gray-200/60 dark:border-gray-700/60"
    >
      <div className="relative aspect-[4/3] bg-gray-200 dark:bg-gray-800 overflow-hidden">
        {displaySrc && !imgError ? (
          <img
            src={displaySrc}
            alt={caption}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center p-4">
            <p className="text-white/90 text-center text-sm font-medium leading-relaxed drop-shadow-lg line-clamp-4">
              {truncate(caption, 120)}
            </p>
          </div>
        )}

        {/* Video play icon */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <Play className="h-6 w-6 text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}

        {/* Caption overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8">
          <p className="text-white text-xs font-medium line-clamp-2 drop-shadow">
            {truncate(caption, 80)}
          </p>
        </div>

        {/* Rank badge */}
        {rank != null && (
          <div
            className={cn(
              "absolute top-3 left-3 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg",
              RANK_STYLES[rank] ?? "bg-gray-700/80 text-white"
            )}
          >
            {rank}
          </div>
        )}

        {/* Score badge */}
        {showScore && photo.finalScore != null && (
          <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-orange-600 dark:text-orange-400 shadow">
            ⭐ {photo.finalScore.toFixed(1)}
          </div>
        )}

        {/* Media type badge */}
        {isVideo && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
            VIDEO
          </div>
        )}

        {/* Multi-photo badge */}
        {photo.photoCount > 1 && (
          <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-800 dark:text-gray-200 text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
            📷 {photo.photoCount}
          </div>
        )}

        {/* Download button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const downloadUrl = imageSrc || displaySrc;
            if (!downloadUrl) return;
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = "";
            a.target = "_blank";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}
          className="absolute bottom-14 right-3 h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          title="Download"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      {/* Card footer */}
      <div className="p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="h-7 w-7 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {user ? getInitials(user.displayName) : "?"}
              </div>
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {user?.displayName ?? "Unknown"}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <MessageCircle className="h-3.5 w-3.5" />
              {reactionCount}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Heart className="h-3.5 w-3.5" />
              {uniqueVotes}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
