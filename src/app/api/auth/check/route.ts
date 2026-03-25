import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  const user = request.cookies.get("admin_user")?.value;

  if (!token || !user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: { username: user, role: "ADMIN" },
  });
}
