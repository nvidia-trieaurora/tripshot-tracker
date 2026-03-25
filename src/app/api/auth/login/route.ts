import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function generateToken(username: string): string {
  const payload = `${username}:${Date.now()}`;
  return crypto
    .createHmac("sha256", process.env.ADMIN_PASSWORD || "tripshot2026")
    .update(payload)
    .digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const validUsername = process.env.ADMIN_USERNAME || "admin";
    const validPassword = process.env.ADMIN_PASSWORD || "tripshot2026";

    if (username !== validUsername || password !== validPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = generateToken(username);

    const response = NextResponse.json({
      success: true,
      user: { username, role: "ADMIN" },
    });

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    response.cookies.set("admin_user", username, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
