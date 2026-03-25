import { NextResponse } from "next/server";
import { ensureSeedData } from "@/lib/seed";

export async function POST() {
  try {
    await ensureSeedData();
    return NextResponse.json({ success: true, message: "Seed data initialized" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to seed data" },
      { status: 500 },
    );
  }
}
