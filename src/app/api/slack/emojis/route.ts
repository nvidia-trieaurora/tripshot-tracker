import { NextResponse } from "next/server";
import { WebClient } from "@slack/web-api";

export async function GET() {
  try {
    const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    const result = await slack.emoji.list();
    return NextResponse.json({
      ok: true,
      count: Object.keys(result.emoji || {}).length,
      emoji: result.emoji,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
