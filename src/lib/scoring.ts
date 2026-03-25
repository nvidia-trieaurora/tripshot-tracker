import { prisma } from "./db";

export interface ScoringWeights {
  votingWeight: number;
  organizerWeight: number;
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
        votingWeight: 70,
        organizerWeight: 30,
        maxOrganizerScore: 10,
      },
    });
  }

  return {
    votingWeight: config.votingWeight,
    organizerWeight: config.organizerWeight,
    maxOrganizerScore: config.maxOrganizerScore,
  };
}

export async function computeFinalScore(photoEntryId: string): Promise<number> {
  const config = await getScoringConfig();
  const entry = await prisma.photoEntry.findUnique({
    where: { id: photoEntryId },
    include: {
      uniqueVotes: true,
    },
  });

  if (!entry) throw new Error("Photo entry not found");

  const allEntries = await prisma.photoEntry.findMany({
    where: { mediaType: "image" },
    include: { uniqueVotes: true },
  });

  const maxVotes = Math.max(...allEntries.map((e) => e.uniqueVotes.length), 1);
  const normalizedVotingScore = (entry.uniqueVotes.length / maxVotes) * 100;

  let normalizedOrganizerScore = 0;
  if (entry.organizerScore !== null && entry.organizerScore !== undefined) {
    normalizedOrganizerScore =
      (entry.organizerScore / config.maxOrganizerScore) * 100;
  }

  const finalScore =
    (normalizedVotingScore * config.votingWeight +
      normalizedOrganizerScore * config.organizerWeight) /
    100;

  return Math.round(finalScore * 100) / 100;
}

export async function recomputeAllScores(): Promise<void> {
  const entries = await prisma.photoEntry.findMany({
    where: { mediaType: "image" },
    include: { uniqueVotes: true },
  });

  const config = await getScoringConfig();
  const maxVotes = Math.max(...entries.map((e) => e.uniqueVotes.length), 1);

  for (const entry of entries) {
    const normalizedVotingScore =
      (entry.uniqueVotes.length / maxVotes) * 100;
    const teamVotingScore = entry.uniqueVotes.length;

    let normalizedOrganizerScore = 0;
    if (entry.organizerScore !== null && entry.organizerScore !== undefined) {
      normalizedOrganizerScore =
        (entry.organizerScore / config.maxOrganizerScore) * 100;
    }

    const finalScore =
      (normalizedVotingScore * config.votingWeight +
        normalizedOrganizerScore * config.organizerWeight) /
      100;

    await prisma.photoEntry.update({
      where: { id: entry.id },
      data: {
        teamVotingScore,
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
