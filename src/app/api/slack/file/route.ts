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
    const slackHeaders: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    // Forward range header for video seeking support
    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      slackHeaders["Range"] = rangeHeader;
    }

    const res = await fetch(url, { headers: slackHeaders });

    if (!res.ok && res.status !== 206) {
      return NextResponse.json(
        { error: `Slack returned ${res.status}` },
        { status: res.status }
      );
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const contentLength = res.headers.get("content-length");
    const contentRange = res.headers.get("content-range");
    const buffer = await res.arrayBuffer();

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      "Accept-Ranges": "bytes",
    };

    if (contentLength) responseHeaders["Content-Length"] = contentLength;
    if (contentRange) responseHeaders["Content-Range"] = contentRange;

    return new NextResponse(buffer, {
      status: res.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}
