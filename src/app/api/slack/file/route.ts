import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  if (!url.startsWith("https://files.slack.com/")) {
    return NextResponse.json({ error: "Invalid Slack URL" }, { status: 400 });
  }

  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Token not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Slack returned ${res.status}` },
        { status: res.status }
      );
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}
