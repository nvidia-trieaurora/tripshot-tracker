import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { syncSlackChannel } from "@/lib/slack";
import { recomputeAllScores } from "@/lib/scoring";

function verifySlackSignature(
  signingSecret: string,
  timestamp: string,
  body: string,
  signature: string
): boolean {
  const fiveMinutes = 5 * 60;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > fiveMinutes) return false;

  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature =
    "v0=" +
    crypto
      .createHmac("sha256", signingSecret)
      .update(sigBasestring)
      .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(signature)
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const parsed = JSON.parse(body);

  // Slack URL verification challenge
  if (parsed.type === "url_verification") {
    return NextResponse.json({ challenge: parsed.challenge });
  }

  // Verify signature
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (signingSecret && signingSecret !== "your-signing-secret") {
    const timestamp = request.headers.get("x-slack-request-timestamp") || "";
    const signature = request.headers.get("x-slack-signature") || "";
    if (!verifySlackSignature(signingSecret, timestamp, body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const event = parsed.event;
  if (!event) {
    return NextResponse.json({ ok: true });
  }

  const channelId = process.env.SLACK_CHANNEL_ID;
  const relevantEvents = ["message", "reaction_added", "reaction_removed"];

  if (relevantEvents.includes(event.type) && event.channel === channelId) {
    // Trigger async sync without blocking the response
    syncSlackChannel(channelId!)
      .then(() => recomputeAllScores())
      .catch(console.error);
  }

  return NextResponse.json({ ok: true });
}
