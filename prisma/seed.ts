import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.scoringConfig.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      votingWeight: 70,
      organizerWeight: 30,
      maxOrganizerScore: 10,
    },
    update: {},
  });

  await prisma.appSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      slackChannelId: process.env.SLACK_CHANNEL_ID || "",
      slackChannelName: "#vrdc-thailandtrip",
      contestName: "TripshotTracker",
      submissionDeadline: new Date("2026-03-27T17:30:00+07:00"),
      votingDeadline: new Date("2026-03-27T18:00:00+07:00"),
      resultAnnouncementDate: new Date("2026-03-27T19:00:00+07:00"),
    },
    update: {},
  });

  const categories = [
    {
      name: "peoples_choice",
      description: "Most voted photo by the team",
      emoji: "🏆",
    },
    {
      name: "best_moment",
      description: "Best moment captured during the trip",
      emoji: "✨",
    },
    {
      name: "craziest_shot",
      description: "The wildest and most unexpected photo",
      emoji: "🤪",
    },
    {
      name: "top_5",
      description: "Top 5 most impressive photos overall",
      emoji: "🌟",
    },
    {
      name: "most_loved",
      description: "Photo with the most love reactions",
      emoji: "❤️",
    },
    {
      name: "creative_spark",
      description: "Most creatively composed photo",
      emoji: "💡",
    },
    {
      name: "wildest_energy",
      description: "Photo with the most energetic vibe",
      emoji: "⚡",
    },
    {
      name: "top_storyteller",
      description: "Best photo with a compelling story/caption",
      emoji: "📖",
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      create: cat,
      update: cat,
    });
  }

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
