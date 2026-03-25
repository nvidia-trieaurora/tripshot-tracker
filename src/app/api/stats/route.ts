import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureSeedData } from "@/lib/seed";

export async function GET() {
  try {
    await ensureSeedData();

    const photosOnly = { mediaType: "image" } as const;

    const [totalSubmissions, totalReactions, topTrending, participantResult, voterResult] =
      await Promise.all([
        prisma.photoEntry.count({ where: photosOnly }),
        prisma.reaction.count({ where: { photoEntry: photosOnly } }),
        prisma.photoEntry.findMany({
          where: photosOnly,
          take: 5,
          orderBy: { trendingScore: "desc" },
          include: {
            slackPost: { include: { user: true } },
            _count: { select: { uniqueVotes: true, reactions: true } },
          },
        }),
        prisma.slackPost.findMany({
          where: { photoEntries: { some: photosOnly } },
          select: { userId: true },
          distinct: ["userId"],
        }),
        prisma.uniqueVote.findMany({
          where: { photoEntry: photosOnly },
          select: { slackUserId: true },
          distinct: ["slackUserId"],
        }),
      ]);

    return NextResponse.json({
      totalSubmissions,
      totalParticipants: participantResult.length,
      totalVoters: voterResult.length,
      totalReactions,
      topTrending,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
