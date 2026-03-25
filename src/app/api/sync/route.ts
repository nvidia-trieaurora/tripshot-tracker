import { NextRequest, NextResponse } from "next/server";
import { syncSlackChannel } from "@/lib/slack";
import { recomputeAllScores } from "@/lib/scoring";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const channelId = body.channelId || process.env.SLACK_CHANNEL_ID;

    if (!channelId) {
      return NextResponse.json(
        { error: "No channel ID provided and SLACK_CHANNEL_ID is not set" },
        { status: 400 },
      );
    }

    const result = await syncSlackChannel(channelId);
    await recomputeAllScores();

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 },
    );
  }
}
