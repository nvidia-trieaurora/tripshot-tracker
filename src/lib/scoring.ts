import { prisma } from "./db";

export interface ScoringWeights {
  votingWeight: number;
  organizerWeight: number;
  reactionWeight: number;
  maxOrganizerScore: number;
}

export async function getScoringConfig(): Promise<ScoringWeights> {
  let config = await prisma.scoringConfig.findUnique({
    where: { id: "default" },
  });

  if (!config) {
    config = await prisma.scoringConfig.create({
      data: {
        id: "default",
        votingWeight: 80,
        organizerWeight: 10,
        reactionWeight: 10,
        maxOrganizerScore: 10,
      },
    });
  }

  return {
    votingWeight: config.votingWeight,
    organizerWeight: config.organizerWeight,
    reactionWeight: config.reactionWeight,
    maxOrganizerScore: config.maxOrganizerScore,
  };
}

export async function computeFinalScore(photoEntryId: string): Promise<number> {
  const config = await getScoringConfig();
  const entry = await prisma.photoEntry.findUnique({
    where: { id: photoEntryId },
    include: { uniqueVotes: true, _count: { select: { reactions: true } } },
  });

  if (!entry) throw new Error("Photo entry not found");

  const uniqueVotes = entry.uniqueVotes.length;
  const totalReactions = entry._count.reactions;
  const organizerScore = entry.organizerScore ?? 0;

  const finalScore =
    (config.votingWeight / 100) * uniqueVotes +
    (config.organizerWeight / 100) * organizerScore +
    (config.reactionWeight / 100) * totalReactions;

  return Math.round(finalScore * 100) / 100;
}

export async function recomputeAllScores(): Promise<void> {
  const entries = await prisma.photoEntry.findMany({
    where: { mediaType: "image" },
    include: { uniqueVotes: true, _count: { select: { reactions: true } } },
  });

  const config = await getScoringConfig();

  for (const entry of entries) {
    const uniqueVotes = entry.uniqueVotes.length;
    const totalReactions = entry._count.reactions;
    const organizerScore = entry.organizerScore ?? 0;

    const finalScore =
      (config.votingWeight / 100) * uniqueVotes +
      (config.organizerWeight / 100) * organizerScore +
      (config.reactionWeight / 100) * totalReactions;

    await prisma.photoEntry.update({
      where: { id: entry.id },
      data: {
        teamVotingScore: uniqueVotes,
        finalScore: Math.round(finalScore * 100) / 100,
      },
    });
  }
}

export function computeTrendingScore(
  recentVoteCount: number,
  totalVotes: number,
  ageHours: number
): number {
  const recency = Math.max(1, 48 - ageHours) / 48;
  const velocity = recentVoteCount / Math.max(1, ageHours);
  return (velocity * 0.6 + recency * 0.2 + (totalVotes / 100) * 0.2) * 100;
}
