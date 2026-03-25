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

    const leaderboard = entries.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
}
