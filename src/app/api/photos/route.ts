import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const sort = searchParams.get("sort") || "latest";
    const category = searchParams.get("category");
    const participant = searchParams.get("participant");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const where: Record<string, unknown> = {};

    if (category) {
      where.categoryTags = { contains: category };
    }

    if (participant) {
      where.slackPost = { userId: participant };
    }

    let orderBy: Record<string, unknown>;
    switch (sort) {
      case "most_liked":
        orderBy = { uniqueVotes: { _count: "desc" } };
        break;
      case "highest_score":
        orderBy = { finalScore: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const allPhotos = await prisma.photoEntry.findMany({
      where,
      orderBy,
      include: {
        slackPost: { include: { user: true } },
        _count: { select: { uniqueVotes: true, reactions: true } },
      },
    });

    // Group by slackPostId: 1 post = 1 gallery entry
    const groupedMap = new Map<string, typeof allPhotos>();
    for (const photo of allPhotos) {
      const group = groupedMap.get(photo.slackPostId) || [];
      group.push(photo);
      groupedMap.set(photo.slackPostId, group);
    }

    const grouped = Array.from(groupedMap.values()).map((group) => {
      const best = group.reduce((a, b) =>
        (a.finalScore ?? 0) >= (b.finalScore ?? 0) ? a : b
      );
      return {
        ...best,
        photoCount: group.length,
        siblingPhotos: group.map((e) => ({
          id: e.id,
          imageUrl: e.imageUrl,
          thumbnailUrl: e.thumbnailUrl,
          imageIndex: e.imageIndex,
          mediaType: e.mediaType,
        })),
      };
    });

    const total = grouped.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const photos = grouped.slice(skip, skip + limit);

    return NextResponse.json({
      photos,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch photos" },
      { status: 500 },
    );
  }
}
