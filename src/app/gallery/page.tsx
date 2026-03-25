"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Search,
  Filter,
  ChevronDown,
  Loader2,
  ArrowUpDown,
  Grid,
  List,
  Image,
  RefreshCw,
} from "lucide-react";
import PhotoCard from "@/components/PhotoCard";
import CategoryBadge from "@/components/CategoryBadge";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, type CategoryName, type PhotoWithDetails } from "@/types";

type SortOption = "latest" | "most_liked" | "highest_score";
type ViewMode = "grid" | "list";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "latest", label: "Latest" },
  { value: "most_liked", label: "Most Liked" },
  { value: "highest_score", label: "Highest Score" },
];

const LIMIT_OPTIONS = [12, 24, 48];

export default function GalleryPage() {
  const [photos, setPhotos] = useState<PhotoWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [sort, setSort] = useState<SortOption>("latest");
  const [category, setCategory] = useState("");
  const [participant, setParticipant] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [loading, setLoading] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort,
        page: String(page),
        limit: String(limit),
      });
      if (category) params.set("category", category);
      if (participant) params.set("participant", participant);

      const res = await fetch(`/api/photos?${params}`);
      const data = await res.json();
      setPhotos(data.photos ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (e) {
      console.error("Failed to fetch photos:", e);
    } finally {
      setLoading(false);
    }
  }, [sort, page, limit, category, participant]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setParticipant(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleSortChange = (value: SortOption) => {
    setSort(value);
    setPage(1);
    setSortOpen(false);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
    setCatOpen(false);
  };

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white">
            <Camera className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Photo Gallery
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {total} photo{total !== 1 ? "s" : ""} submitted
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-3"
      >
        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setSortOpen(!sortOpen);
              setCatOpen(false);
            }}
            className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
          >
            <ArrowUpDown className="h-4 w-4 text-gray-400" />
            {currentSortLabel}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-gray-400 transition-transform",
                sortOpen && "rotate-180"
              )}
            />
          </button>
          <AnimatePresence>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute z-20 mt-1 w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1"
              >
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSortChange(opt.value)}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm transition-colors",
                      sort === opt.value
                        ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Category dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setCatOpen(!catOpen);
              setSortOpen(false);
            }}
            className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
          >
            <Filter className="h-4 w-4 text-gray-400" />
            {category
              ? CATEGORY_LABELS[category as CategoryName] ?? category
              : "All Categories"}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-gray-400 transition-transform",
                catOpen && "rotate-180"
              )}
            />
          </button>
          <AnimatePresence>
            {catOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute z-20 mt-1 w-56 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1 max-h-64 overflow-y-auto"
              >
                <button
                  onClick={() => handleCategoryChange("")}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors",
                    !category
                      ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  All Categories
                </button>
                {(
                  Object.entries(CATEGORY_LABELS) as [CategoryName, string][]
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleCategoryChange(key)}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm transition-colors",
                      category === key
                        ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by participant..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400 transition-colors"
          />
        </div>

        {/* View toggle */}
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2.5 transition-colors",
              viewMode === "grid"
                ? "bg-orange-500 text-white"
                : "bg-white dark:bg-gray-900 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2.5 transition-colors",
              viewMode === "list"
                ? "bg-orange-500 text-white"
                : "bg-white dark:bg-gray-900 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {/* Refresh */}
        <button
          onClick={fetchPhotos}
          disabled={loading}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:text-orange-500 hover:border-orange-300 dark:hover:border-orange-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={cn("h-4 w-4", loading && "animate-spin")}
          />
        </button>
      </motion.div>

      {/* Active category badge */}
      {category && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Filtering:
          </span>
          <CategoryBadge category={category} />
          <button
            onClick={() => handleCategoryChange("")}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* Photo grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading photos...
          </p>
        </div>
      ) : photos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 gap-4"
        >
          <div className="text-6xl">📭</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            No photos found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm text-center">
            Try adjusting your filters or search term. New photos are synced
            from Slack regularly!
          </p>
          <button
            onClick={() => {
              setCategory("");
              setSearchInput("");
              setParticipant("");
              setSort("latest");
              setPage(1);
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            Reset Filters
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className={cn(
            "grid gap-4",
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-2"
          )}
        >
          {photos.map((photo, i) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
            >
              <PhotoCard
                photo={photo}
                rank={sort === "latest" ? undefined : (page - 1) * limit + i + 1}
                showScore={sort === "highest_score"}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 0 && photos.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-800"
        >
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Show</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            >
              {LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>per page</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
