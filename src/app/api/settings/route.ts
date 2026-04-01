import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureSeedData } from "@/lib/seed";
import { recomputeAllScores } from "@/lib/scoring";

export async function GET() {
  try {
    await ensureSeedData();

    const [appSettings, scoringConfig] = await Promise.all([
      prisma.appSettings.findUnique({ where: { id: "default" } }),
      prisma.scoringConfig.findUnique({ where: { id: "default" } }),
    ]);

    return NextResponse.json({ appSettings, scoringConfig });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { appSettings: appSettingsUpdate, scoringConfig: scoringConfigUpdate } = body;

    let appSettings = null;
    let scoringConfig = null;

    if (appSettingsUpdate) {
      appSettings = await prisma.appSettings.update({
        where: { id: "default" },
        data: {
          ...(appSettingsUpdate.slackChannelId !== undefined && {
            slackChannelId: appSettingsUpdate.slackChannelId,
          }),
          ...(appSettingsUpdate.slackChannelName !== undefined && {
            slackChannelName: appSettingsUpdate.slackChannelName,
          }),
          ...(appSettingsUpdate.contestName !== undefined && {
            contestName: appSettingsUpdate.contestName,
          }),
          ...(appSettingsUpdate.submissionDeadline !== undefined && {
            submissionDeadline: new Date(appSettingsUpdate.submissionDeadline),
          }),
          ...(appSettingsUpdate.votingDeadline !== undefined && {
            votingDeadline: new Date(appSettingsUpdate.votingDeadline),
          }),
          ...(appSettingsUpdate.resultAnnouncementDate !== undefined && {
            resultAnnouncementDate: new Date(appSettingsUpdate.resultAnnouncementDate),
          }),
          ...(appSettingsUpdate.autoSyncEnabled !== undefined && {
            autoSyncEnabled: appSettingsUpdate.autoSyncEnabled,
          }),
          ...(appSettingsUpdate.autoSyncInterval !== undefined && {
            autoSyncInterval: appSettingsUpdate.autoSyncInterval,
          }),
        },
      });
    }

    if (scoringConfigUpdate) {
      scoringConfig = await prisma.scoringConfig.update({
        where: { id: "default" },
        data: {
          ...(scoringConfigUpdate.votingWeight !== undefined && {
            votingWeight: scoringConfigUpdate.votingWeight,
          }),
          ...(scoringConfigUpdate.organizerWeight !== undefined && {
            organizerWeight: scoringConfigUpdate.organizerWeight,
          }),
          ...(scoringConfigUpdate.reactionWeight !== undefined && {
            reactionWeight: scoringConfigUpdate.reactionWeight,
          }),
          ...(scoringConfigUpdate.maxOrganizerScore !== undefined && {
            maxOrganizerScore: scoringConfigUpdate.maxOrganizerScore,
          }),
        },
      });

      await recomputeAllScores();
    }

    const current = await Promise.all([
      prisma.appSettings.findUnique({ where: { id: "default" } }),
      prisma.scoringConfig.findUnique({ where: { id: "default" } }),
    ]);

    return NextResponse.json({
      appSettings: appSettings ?? current[0],
      scoringConfig: scoringConfig ?? current[1],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update settings" },
      { status: 500 },
    );
  }
}
