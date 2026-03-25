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
    const skip = (page - 1) * limit;

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

    const [photos, total] = await Promise.all([
      prisma.photoEntry.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          slackPost: { include: { user: true } },
          _count: { select: { uniqueVotes: true, reactions: true } },
        },
      }),
      prisma.photoEntry.count({ where }),
    ]);

    return NextResponse.json({
      photos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch photos" },
      { status: 500 },
    );
  }
}
