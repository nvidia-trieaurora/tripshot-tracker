export interface PhotoWithDetails {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  mediaType: string;
  imageIndex: number;
  caption: string | null;
  categoryTags: string | null;
  organizerCreativity: number | null;
  organizerEmotion: number | null;
  organizerStorytelling: number | null;
  organizerScore: number | null;
  organizerNotes: string | null;
  teamVotingScore: number | null;
  finalScore: number | null;
  isFeatured: boolean;
  trendingScore: number | null;
  createdAt: string;
  updatedAt: string;
  slackPost: {
    id: string;
    slackPermalink: string | null;
    caption: string | null;
    postedAt: string;
    user: {
      id: string;
      slackId: string;
      displayName: string;
      avatarUrl: string | null;
    };
  };
  reactions: ReactionData[];
  uniqueVotes: { slackUserId: string }[];
  voters?: { slackUserId: string; displayName: string; avatarUrl: string | null; votedAt: string }[];
  _count: {
    uniqueVotes: number;
    reactions: number;
  };
}

export interface ReactionData {
  emoji: string;
  slackUserId: string;
}

export interface ReactionBreakdown {
  emoji: string;
  count: number;
  users: string[];
}

export interface LeaderboardEntry {
  rank: number;
  photo: PhotoWithDetails;
  category?: string;
}

export interface ContestStats {
  totalSubmissions: number;
  totalParticipants: number;
  totalVoters: number;
  totalReactions: number;
  topTrending: PhotoWithDetails[];
}

export interface SyncResult {
  status: string;
  messagesProcessed: number;
  photosFound: number;
  newPhotos: number;
  reactionsUpdated: number;
  errors: string[];
  duration: number;
}

export interface ScoringWeights {
  votingWeight: number;
  organizerWeight: number;
  maxOrganizerScore: number;
}

export type CategoryName =
  | "peoples_choice"
  | "best_moment"
  | "craziest_shot"
  | "top_5"
  | "most_loved"
  | "creative_spark"
  | "wildest_energy"
  | "top_storyteller";

export const CATEGORY_LABELS: Record<CategoryName, string> = {
  peoples_choice: "People's Choice",
  best_moment: "Best Moment of the Trip",
  craziest_shot: "Craziest Shot",
  top_5: "Top 5 Impressive Photos",
  most_loved: "Most Loved",
  creative_spark: "Creative Spark",
  wildest_energy: "Wildest Energy",
  top_storyteller: "Top Storyteller",
};

export const CATEGORY_EMOJIS: Record<CategoryName, string> = {
  peoples_choice: "🏆",
  best_moment: "✨",
  craziest_shot: "🤪",
  top_5: "🌟",
  most_loved: "❤️",
  creative_spark: "💡",
  wildest_energy: "⚡",
  top_storyteller: "📖",
};
