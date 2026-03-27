import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const photo = await prisma.photoEntry.findUnique({
      where: { id },
      include: {
        slackPost: { include: { user: true } },
        reactions: true,
        uniqueVotes: {
          include: { user: true },
        },
        _count: { select: { uniqueVotes: true, reactions: true } },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Build a lookup map: slackId -> displayName
    const allSlackIds = new Set<string>();
    for (const r of photo.reactions) allSlackIds.add(r.slackUserId);
    for (const v of photo.uniqueVotes) allSlackIds.add(v.slackUserId);

    const users = await prisma.user.findMany({
      where: { slackId: { in: Array.from(allSlackIds) } },
      select: { slackId: true, displayName: true, avatarUrl: true },
    });

    const nameMap = new Map<string, { displayName: string; avatarUrl: string | null }>();
    for (const u of users) {
      nameMap.set(u.slackId, { displayName: u.displayName, avatarUrl: u.avatarUrl });
    }

    const getName = (slackId: string) =>
      nameMap.get(slackId)?.displayName || slackId;

    // Reaction breakdown with real names
    const reactionMap = new Map<string, { slackId: string; name: string }[]>();
    for (const r of photo.reactions) {
      const list = reactionMap.get(r.emoji) || [];
      list.push({ slackId: r.slackUserId, name: getName(r.slackUserId) });
      reactionMap.set(r.emoji, list);
    }

    const reactionBreakdown = Array.from(reactionMap.entries())
      .map(([emoji, reactors]) => ({
        emoji,
        count: reactors.length,
        users: reactors.map((r) => r.name),
      }))
      .sort((a, b) => b.count - a.count);

    // Unique voters with real names
    const votersWithNames = photo.uniqueVotes.map((v) => ({
      slackUserId: v.slackUserId,
      displayName: v.user?.displayName || getName(v.slackUserId),
      avatarUrl: v.user?.avatarUrl || nameMap.get(v.slackUserId)?.avatarUrl || null,
      votedAt: v.createdAt,
    }));

    // Fetch sibling photos from the same Slack post
    const siblingPhotos = await prisma.photoEntry.findMany({
      where: { slackPostId: photo.slackPostId },
      orderBy: { imageIndex: "asc" },
      select: {
        id: true,
        imageUrl: true,
        thumbnailUrl: true,
        imageIndex: true,
        mediaType: true,
      },
    });

    return NextResponse.json({
      ...photo,
      reactionBreakdown,
      voters: votersWithNames,
      siblingPhotos,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch photo" },
      { status: 500 },
    );
  }
}
