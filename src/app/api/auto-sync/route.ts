import { NextResponse } from "next/server";
import { syncSlackChannel } from "@/lib/slack";
import { recomputeAllScores } from "@/lib/scoring";
import { prisma } from "@/lib/db";

let lastSyncTime = 0;
const MIN_SYNC_INTERVAL = 30_000; // 30 seconds minimum between syncs

export async function POST() {
  const now = Date.now();
  if (now - lastSyncTime < MIN_SYNC_INTERVAL) {
    return NextResponse.json({
      skipped: true,
      message: "Sync too frequent, try again later",
      nextSyncIn: Math.ceil((MIN_SYNC_INTERVAL - (now - lastSyncTime)) / 1000),
    });
  }

  lastSyncTime = now;

  try {
    const channelId = process.env.SLACK_CHANNEL_ID;
    if (!channelId) {
      return NextResponse.json(
        { error: "SLACK_CHANNEL_ID not configured" },
        { status: 400 }
      );
    }

    const result = await syncSlackChannel(channelId);
    await recomputeAllScores();

    const settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
    });

    return NextResponse.json({
      ...result,
      autoSyncEnabled: settings?.autoSyncEnabled ?? false,
      autoSyncInterval: settings?.autoSyncInterval ?? 60,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
