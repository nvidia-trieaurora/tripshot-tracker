import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    await prisma.reaction.deleteMany({});
    await prisma.uniqueVote.deleteMany({});
    await prisma.photoEntry.deleteMany({});
    await prisma.slackPost.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.syncLog.deleteMany({});

    return NextResponse.json({ success: true, message: "All data cleared" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset" },
      { status: 500 }
    );
  }
}
