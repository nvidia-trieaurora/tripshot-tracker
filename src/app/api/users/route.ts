import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { slackId: true, displayName: true },
    });
    const map: Record<string, string> = {};
    for (const u of users) {
      map[u.slackId] = u.displayName;
    }
    return NextResponse.json(map);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
