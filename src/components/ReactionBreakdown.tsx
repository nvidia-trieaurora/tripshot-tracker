"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { slackEmojiToUnicode } from "@/lib/emoji";

interface ReactionItem {
  emoji: string;
  count: number;
  users: string[];
}

interface ReactionBreakdownProps {
  reactions: ReactionItem[];
}

function ReactionPill({ reaction }: { reaction: ReactionItem }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm",
          "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700",
          "border border-gray-200 dark:border-gray-700 transition-colors cursor-default"
        )}
      >
        <span className="text-base">{slackEmojiToUnicode(reaction.emoji)}</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {reaction.count}
        </span>
      </div>

      {showTooltip && reaction.users.length > 0 && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg shadow-lg whitespace-nowrap max-w-[200px]">
          <p className="truncate">{reaction.users.join(", ")}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
        </div>
      )}
    </div>
  );
}

export default function ReactionBreakdown({ reactions }: ReactionBreakdownProps) {
  const sorted = [...reactions].sort((a, b) => b.count - a.count);

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 italic">
        No reactions yet
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sorted.map((r) => (
        <ReactionPill key={r.emoji} reaction={r} />
      ))}
    </div>
  );
}
