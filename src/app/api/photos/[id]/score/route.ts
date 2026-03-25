import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeFinalScore } from "@/lib/scoring";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { creativity, emotion, storytelling, notes, categoryTags } = body;

    if (
      typeof creativity !== "number" || creativity < 0 || creativity > 10 ||
      typeof emotion !== "number" || emotion < 0 || emotion > 10 ||
      typeof storytelling !== "number" || storytelling < 0 || storytelling > 10
    ) {
      return NextResponse.json(
        { error: "creativity, emotion, and storytelling must be numbers between 0 and 10" },
        { status: 400 },
      );
    }

    const existing = await prisma.photoEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }
    if (existing.mediaType === "video") {
      return NextResponse.json({ error: "Scoring is only available for photos, not videos" }, { status: 400 });
    }

    const organizerScore = (creativity + emotion + storytelling) / 3;
    const organizerScoreRounded = Math.round(organizerScore * 100) / 100;

    await prisma.photoEntry.update({
      where: { id },
      data: {
        organizerCreativity: creativity,
        organizerEmotion: emotion,
        organizerStorytelling: storytelling,
        organizerScore: organizerScoreRounded,
        organizerNotes: notes ?? null,
        categoryTags: categoryTags ? JSON.stringify(categoryTags) : existing.categoryTags,
      },
    });

    const finalScore = await computeFinalScore(id);

    const updated = await prisma.photoEntry.update({
      where: { id },
      data: { finalScore },
      include: {
        slackPost: { include: { user: true } },
        _count: { select: { uniqueVotes: true, reactions: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update score" },
      { status: 500 },
    );
  }
}
