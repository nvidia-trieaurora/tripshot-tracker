import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const photos = await prisma.photoEntry.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        slackPost: {
          include: {
            user: true,
          },
        },
        reactions: {
          include: { user: true },
        },
        uniqueVotes: {
          include: {
            user: true,
          },
        },
      },
    });

    const detailed = photos.map((photo) => {
      const reactionMap = new Map<
        string,
        { emoji: string; count: number; users: string[] }
      >();

      for (const r of photo.reactions) {
        const displayName = r.user?.displayName || r.slackUserId;
        const existing = reactionMap.get(r.emoji);
        if (existing) {
          existing.count++;
          existing.users.push(displayName);
        } else {
          reactionMap.set(r.emoji, {
            emoji: r.emoji,
            count: 1,
            users: [displayName],
          });
        }
      }

      const voterDetails = photo.uniqueVotes.map((v) => ({
        slackUserId: v.slackUserId,
        displayName: v.user?.displayName || v.slackUserId,
        avatarUrl: v.user?.avatarUrl || null,
        votedAt: v.createdAt,
      }));

      return {
        id: photo.id,
        imageUrl: photo.imageUrl,
        thumbnailUrl: photo.thumbnailUrl,
        mediaType: photo.mediaType,
        caption: photo.caption,
        finalScore: photo.finalScore,
        teamVotingScore: photo.teamVotingScore,
        organizerScore: photo.organizerScore,
        organizerCreativity: photo.organizerCreativity,
        organizerEmotion: photo.organizerEmotion,
        organizerStorytelling: photo.organizerStorytelling,
        categoryTags: photo.categoryTags,
        createdAt: photo.createdAt,
        slackPermalink: photo.slackPost.slackPermalink,
        postedAt: photo.slackPost.postedAt,
        submitter: {
          id: photo.slackPost.user.id,
          slackId: photo.slackPost.user.slackId,
          displayName: photo.slackPost.user.displayName,
          realName: photo.slackPost.user.realName,
          avatarUrl: photo.slackPost.user.avatarUrl,
        },
        totalUniqueVoters: photo.uniqueVotes.length,
        totalReactions: photo.reactions.length,
        reactionBreakdown: Array.from(reactionMap.values()).sort(
          (a, b) => b.count - a.count
        ),
        voters: voterDetails,
      };
    });

    return NextResponse.json(detailed);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}
