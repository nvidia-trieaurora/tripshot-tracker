import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const logs = await prisma.syncLog.findMany({
      take: 20,
      orderBy: { syncedAt: "desc" },
    });

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch sync logs" },
      { status: 500 },
    );
  }
}
