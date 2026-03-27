import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get("category");

    const where: Record<string, unknown> = { mediaType: "image" };
    if (category) {
      where.categoryTags = { contains: category };
    }

    const entries = await prisma.photoEntry.findMany({
      where,
      orderBy: { finalScore: "desc" },
      include: {
        slackPost: { include: { user: true } },
        _count: { select: { uniqueVotes: true, reactions: true } },
      },
    });

    // Group entries by slackPostId: one post = one submission
    const groupedMap = new Map<string, typeof entries>();
    for (const entry of entries) {
      const group = groupedMap.get(entry.slackPostId) || [];
      group.push(entry);
      groupedMap.set(entry.slackPostId, group);
    }

    const leaderboard = Array.from(groupedMap.values()).map((group) => {
      // Use the entry with the highest finalScore as the representative
      const best = group.reduce((a, b) =>
        (a.finalScore ?? 0) >= (b.finalScore ?? 0) ? a : b
      );

      // Sum votes and reactions across all photos in the post
      const totalVotes = group.reduce((sum, e) => sum + (e._count?.uniqueVotes ?? 0), 0);
      const totalReactions = group.reduce((sum, e) => sum + (e._count?.reactions ?? 0), 0);

      return {
        ...best,
        photos: group.map((e) => ({
          id: e.id,
          imageUrl: e.imageUrl,
          thumbnailUrl: e.thumbnailUrl,
          imageIndex: e.imageIndex,
          mediaType: e.mediaType,
        })),
        photoCount: group.length,
        _count: {
          uniqueVotes: totalVotes,
          reactions: totalReactions,
        },
      };
    });

    // Sort by finalScore descending, then assign ranks
    leaderboard.sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));
    const ranked = leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    return NextResponse.json(ranked);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
}
