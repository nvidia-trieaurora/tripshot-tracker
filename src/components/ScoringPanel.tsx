"use client";

import { useState } from "react";
import { Save, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, CATEGORY_EMOJIS, type CategoryName } from "@/types";

interface ScoringPanelProps {
  photoId: string;
  initialScores?: {
    creativity: number;
    emotion: number;
    storytelling: number;
    notes: string;
  };
  initialCategories?: string[];
  onSave?: () => void;
}

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as CategoryName[];

const SLIDER_COLORS: Record<string, string> = {
  creativity: "accent-violet-500",
  emotion: "accent-rose-500",
  storytelling: "accent-amber-500",
};

export default function ScoringPanel({
  photoId,
  initialScores,
  initialCategories = [],
  onSave,
}: ScoringPanelProps) {
  const [creativity, setCreativity] = useState(initialScores?.creativity ?? 5);
  const [emotion, setEmotion] = useState(initialScores?.emotion ?? 5);
  const [storytelling, setStorytelling] = useState(
    initialScores?.storytelling ?? 5
  );
  const [notes, setNotes] = useState(initialScores?.notes ?? "");
  const [categories, setCategories] = useState<CategoryName[]>(
    initialCategories as CategoryName[]
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleCategory = (cat: CategoryName) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/photos/${photoId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creativity,
          emotion,
          storytelling,
          notes,
          categoryTags: categories,
        }),
      });
      setSaved(true);
      onSave?.();
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const sliders = [
    { label: "Creativity", value: creativity, set: setCreativity, key: "creativity" },
    { label: "Emotion", value: emotion, set: setEmotion, key: "emotion" },
    { label: "Storytelling", value: storytelling, set: setStorytelling, key: "storytelling" },
  ] as const;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Organizer Scoring
      </h3>

      {/* Sliders */}
      <div className="space-y-4">
        {sliders.map((s) => (
          <div key={s.key}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {s.label}
              </label>
              <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                {s.value}/10
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={s.value}
              onChange={(e) => s.set(Number(e.target.value))}
              className={cn(
                "w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 cursor-pointer",
                SLIDER_COLORS[s.key]
              )}
            />
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Organizer Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Add notes about this photo..."
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 resize-none"
        />
      </div>

      {/* Category tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                categories.includes(cat)
                  ? "bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
              )}
            >
              {CATEGORY_EMOJIS[cat]} {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors",
          saved
            ? "bg-emerald-500 text-white"
            : "bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-600 hover:to-rose-600",
          saving && "opacity-70 cursor-not-allowed"
        )}
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saving ? "Saving..." : saved ? "Saved!" : "Save Scores"}
      </button>
    </div>
  );
}
