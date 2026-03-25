"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { cn, getInitials } from "@/lib/utils";
import { slackEmojiToUnicode } from "@/lib/emoji";
import { useSlackFormat } from "@/lib/useSlackFormat";
import StatsCard from "@/components/StatsCard";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import {
  Settings,
  RefreshCw,
  Download,
  Database,
  Sliders,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  ExternalLink,
  Shield,
  Activity,
  LogIn,
  LogOut,
  Eye,
  EyeOff,
  Users,
  Heart,
  Camera,
  Star,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";

// ─── Types ───
interface AdminPhoto {
  id: string;
  imageUrl: string;
  caption: string | null;
  finalScore: number | null;
  teamVotingScore: number | null;
  organizerScore: number | null;
  organizerCreativity: number | null;
  organizerEmotion: number | null;
  organizerStorytelling: number | null;
  categoryTags: string | null;
  createdAt: string;
  slackPermalink: string | null;
  postedAt: string;
  submitter: {
    slackId: string;
    displayName: string;
    realName: string | null;
    avatarUrl: string | null;
  };
  totalUniqueVoters: number;
  totalReactions: number;
  reactionBreakdown: { emoji: string; count: number; users: string[] }[];
  voters: {
    slackUserId: string;
    displayName: string;
    avatarUrl: string | null;
    votedAt: string;
  }[];
}

interface SyncLog {
  id: string;
  syncedAt: string;
  status: string;
  messagesProcessed: number;
  photosFound: number;
  newPhotos: number;
  reactionsUpdated: number;
  errors: string | null;
  duration: number | null;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

// ─── Login Screen ───
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError("Invalid username or password");
        return;
      }
      onLogin();
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-white mb-4">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Login
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            TripshotTracker Admin Panel
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4 shadow-lg"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Photo Detail Row ───
function PhotoDetailCard({
  photo,
  expanded,
  onToggle,
  fmt,
}: {
  photo: AdminPhoto;
  expanded: boolean;
  onToggle: () => void;
  fmt: (text: string | null | undefined) => string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
      >
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {photo.submitter.avatarUrl ? (
            <img
              src={photo.submitter.avatarUrl}
              alt=""
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            getInitials(photo.submitter.displayName)
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white truncate">
            {fmt(photo.caption) || "No caption"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            by {photo.submitter.displayName} • {format(new Date(photo.postedAt), "MMM d, HH:mm")}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-center">
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {photo.totalUniqueVoters}
            </p>
            <p className="text-[10px] text-gray-500 uppercase">Voters</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {photo.totalReactions}
            </p>
            <p className="text-[10px] text-gray-500 uppercase">Reactions</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
              {photo.finalScore?.toFixed(1) ?? "—"}
            </p>
            <p className="text-[10px] text-gray-500 uppercase">Score</p>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-4 space-y-5">
          {/* Submitter Info */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Camera className="h-4 w-4 text-orange-500" /> Submitter
            </h4>
            <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl px-4 py-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-sm font-bold">
                {getInitials(photo.submitter.displayName)}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {photo.submitter.displayName}
                </p>
                <p className="text-xs text-gray-500">
                  Slack ID: {photo.submitter.slackId}
                  {photo.submitter.realName && ` • ${photo.submitter.realName}`}
                </p>
              </div>
              {photo.slackPermalink && (
                <a
                  href={photo.slackPermalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-orange-600 hover:text-orange-700"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Reaction Breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" /> Reactions ({photo.totalReactions} total)
            </h4>
            {photo.reactionBreakdown.length > 0 ? (
              <div className="space-y-2">
                {photo.reactionBreakdown.map((r) => (
                  <div
                    key={r.emoji}
                    className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5"
                  >
                    <span className="text-xl">{slackEmojiToUnicode(r.emoji)}</span>
                    <span className="font-bold text-gray-900 dark:text-white min-w-[24px]">
                      {r.count}
                    </span>
                    <div className="flex flex-wrap gap-1 flex-1">
                      {r.users.map((userId) => (
                        <span
                          key={userId}
                          className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5"
                        >
                          {userId}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No reactions yet</p>
            )}
          </div>

          {/* Unique Voters */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" /> Unique Voters ({photo.totalUniqueVoters})
            </h4>
            {photo.voters.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {photo.voters.map((voter) => (
                  <div
                    key={voter.slackUserId}
                    className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg px-3 py-2"
                  >
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {getInitials(voter.displayName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {voter.displayName}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {format(new Date(voter.votedAt), "HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No voters yet</p>
            )}
          </div>

          {/* Organizer Score */}
          {photo.organizerScore !== null && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" /> Organizer Score
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Creativity", value: photo.organizerCreativity },
                  { label: "Emotion", value: photo.organizerEmotion },
                  { label: "Storytelling", value: photo.organizerStorytelling },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-amber-50 dark:bg-amber-950/20 rounded-xl px-3 py-2 text-center"
                  >
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {s.value?.toFixed(1) ?? "—"}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ───
export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"photos" | "sync" | "settings" | "data">("photos");
  const fmt = useSlackFormat();

  // Photos tab
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaFilter, setMediaFilter] = useState<"all" | "image" | "video">("image");

  // Sync tab
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const autoSyncRef = useRef<NodeJS.Timeout | null>(null);

  // Settings tab
  const [votingWeight, setVotingWeight] = useState(70);
  const [organizerWeight, setOrganizerWeight] = useState(30);
  const [saving, setSaving] = useState(false);

  // Stats
  const [stats, setStats] = useState<any>(null);

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = ++toastIdRef.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  // Auth check
  useEffect(() => {
    fetch("/api/auth/check")
      .then((r) => setAuthenticated(r.ok))
      .catch(() => setAuthenticated(false));
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (!authenticated) return;
    loadPhotos();
    loadSyncLogs();
    loadStats();
    loadSettings();
  }, [authenticated]);

  // Auto-sync
  useEffect(() => {
    if (autoSyncEnabled && authenticated) {
      autoSyncRef.current = setInterval(() => {
        fetch("/api/auto-sync", { method: "POST" })
          .then((r) => r.json())
          .then((data) => {
            if (data.newPhotos > 0 || data.reactionsUpdated > 0) {
              loadPhotos();
              loadStats();
              addToast(
                `Auto-sync: ${data.newPhotos} new photos, ${data.reactionsUpdated} reactions`,
                "success"
              );
            }
          })
          .catch(() => {});
      }, 60000);
    }
    return () => {
      if (autoSyncRef.current) clearInterval(autoSyncRef.current);
    };
  }, [autoSyncEnabled, authenticated, addToast]);

  const loadPhotos = () => {
    setPhotosLoading(true);
    fetch("/api/admin/photos")
      .then((r) => r.json())
      .then(setPhotos)
      .catch(() => addToast("Failed to load photos", "error"))
      .finally(() => setPhotosLoading(false));
  };

  const loadSyncLogs = () => {
    fetch("/api/sync-logs")
      .then((r) => r.json())
      .then(setSyncLogs)
      .catch(() => {});
  };

  const loadStats = () => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  };

  const loadSettings = () => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.scoringConfig) {
          setVotingWeight(data.scoringConfig.votingWeight);
          setOrganizerWeight(data.scoringConfig.organizerWeight);
        }
      })
      .catch(() => {});
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      setSyncResult(data);
      addToast(
        `Synced: ${data.photosFound} photos, ${data.reactionsUpdated} reactions`,
        "success"
      );
      loadPhotos();
      loadSyncLogs();
      loadStats();
    } catch {
      addToast("Sync failed", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
  };

  const handleSaveWeights = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scoringConfig: { votingWeight, organizerWeight },
        }),
      });
      addToast("Scoring weights saved", "success");
      loadPhotos();
    } catch {
      addToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = async () => {
    const header = "Rank,Caption,Submitter,Unique Voters,Total Reactions,Final Score,Slack Link\n";
    const rows = photos
      .sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))
      .map(
        (p, i) =>
          `${i + 1},"${(p.caption || "").replace(/"/g, '""')}",${p.submitter.displayName},${p.totalUniqueVoters},${p.totalReactions},${p.finalScore?.toFixed(2) ?? ""},${p.slackPermalink ?? ""}`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tripshot-leaderboard-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("CSV exported", "success");
  };

  const filteredPhotos = photos.filter((p: any) => {
    if (mediaFilter !== "all" && p.mediaType !== mediaFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.submitter.displayName.toLowerCase().includes(q) ||
      (p.caption || "").toLowerCase().includes(q)
    );
  });

  // ─── Loading / Login ───
  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }
  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  }

  // ─── Tabs ───
  const TABS = [
    { id: "photos" as const, label: "Photo Manager", icon: Camera },
    { id: "sync" as const, label: "Slack Sync", icon: RefreshCw },
    { id: "settings" as const, label: "Settings", icon: Sliders },
    { id: "data" as const, label: "Data & Export", icon: Database },
  ];

  return (
    <div className="min-h-screen">
      {/* Toast */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "px-4 py-3 rounded-xl text-sm font-medium shadow-lg slide-up max-w-sm",
              t.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white"
            )}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-orange-400" />
            <div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-sm text-gray-400">TripshotTracker Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {autoSyncEnabled && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/30 rounded-full px-3 py-1">
                <Activity className="h-3 w-3 animate-pulse" /> Auto-sync ON
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition-colors"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-16 z-30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors shrink-0",
                activeTab === tab.id
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        {/* ─── Photos Tab ─── */}
        {activeTab === "photos" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Submissions ({filteredPhotos.length})
                </h2>
                <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden text-xs">
                  {(["image", "video", "all"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setMediaFilter(f)}
                      className={cn(
                        "px-3 py-1.5 font-medium transition-colors capitalize",
                        mediaFilter === f
                          ? "bg-orange-500 text-white"
                          : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      {f === "image" ? "Photos" : f === "video" ? "Videos" : "All"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or caption..."
                    className="w-full sm:w-64 pl-9 pr-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <button
                  onClick={loadPhotos}
                  className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <RefreshCw className={cn("h-4 w-4", photosLoading && "animate-spin")} />
                </button>
              </div>
            </div>

            {photosLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : filteredPhotos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Camera className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No photos found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPhotos.map((photo) => (
                  <PhotoDetailCard
                    key={photo.id}
                    photo={photo}
                    expanded={expandedId === photo.id}
                    fmt={fmt}
                    onToggle={() =>
                      setExpandedId(expandedId === photo.id ? null : photo.id)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Sync Tab ─── */}
        {activeTab === "sync" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <RefreshCw className={cn("h-5 w-5", syncing && "animate-spin")} />
                {syncing ? "Syncing..." : "Sync with Slack"}
              </button>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncEnabled}
                  onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Auto-sync every 60 seconds
                </span>
              </label>
            </div>

            {syncResult && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
                  Last Sync Result
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Messages</p>
                    <p className="font-bold">{syncResult.messagesProcessed}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Photos Found</p>
                    <p className="font-bold">{syncResult.photosFound}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">New Photos</p>
                    <p className="font-bold">{syncResult.newPhotos}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Reactions</p>
                    <p className="font-bold">{syncResult.reactionsUpdated}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sync Logs */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Sync History</h3>
              <div className="space-y-2">
                {syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm"
                  >
                    {log.status === "SUCCESS" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <span className="text-gray-500 shrink-0">
                      {format(new Date(log.syncedAt), "MMM d, HH:mm:ss")}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {log.photosFound} photos • {log.reactionsUpdated} reactions
                    </span>
                    {log.duration && (
                      <span className="text-gray-400 ml-auto flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {(log.duration / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                ))}
                {syncLogs.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No sync history yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Settings Tab ─── */}
        {activeTab === "settings" && (
          <div className="space-y-6 max-w-lg">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-orange-500" /> Scoring Weights
              </h3>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Team Voting: <span className="font-bold text-orange-600">{votingWeight}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={votingWeight}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setVotingWeight(v);
                    setOrganizerWeight(100 - v);
                  }}
                  className="w-full mt-1 accent-orange-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Organizer Panel: <span className="font-bold text-violet-600">{organizerWeight}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={organizerWeight}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setOrganizerWeight(v);
                    setVotingWeight(100 - v);
                  }}
                  className="w-full mt-1 accent-violet-500"
                />
              </div>
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Team {votingWeight}% + Organizer {organizerWeight}% = 100%
                </span>
              </div>
              <button
                onClick={handleSaveWeights}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Weights
              </button>
            </div>
          </div>
        )}

        {/* ─── Data Tab ─── */}
        {activeTab === "data" && (
          <div className="space-y-6">
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Photos" value={stats.totalSubmissions} icon={<Camera className="h-5 w-5" />} color="orange" />
                <StatsCard title="Participants" value={stats.totalParticipants} icon={<Users className="h-5 w-5" />} color="emerald" />
                <StatsCard title="Voters" value={stats.totalVoters} icon={<Heart className="h-5 w-5" />} color="rose" />
                <StatsCard title="Reactions" value={stats.totalReactions} icon={<Star className="h-5 w-5" />} color="amber" />
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
              >
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
                  <Download className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">Export CSV</p>
                  <p className="text-sm text-gray-500">Download leaderboard as CSV</p>
                </div>
              </button>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                <QRCodeDisplay
                  url="https://nvidia.enterprise.slack.com/archives/C0ANQNPS8BU"
                  title="Scan to open #vrdc-thailandtrip"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
