-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slackId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "realName" TEXT,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SlackPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slackMessageTs" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "threadTs" TEXT,
    "userId" TEXT NOT NULL,
    "caption" TEXT,
    "slackPermalink" TEXT,
    "postedAt" DATETIME NOT NULL,
    "rawText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SlackPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PhotoEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slackPostId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "imageIndex" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "categoryTags" TEXT,
    "organizerCreativity" REAL,
    "organizerEmotion" REAL,
    "organizerStorytelling" REAL,
    "organizerScore" REAL,
    "organizerNotes" TEXT,
    "teamVotingScore" REAL,
    "finalScore" REAL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "trendingScore" REAL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PhotoEntry_slackPostId_fkey" FOREIGN KEY ("slackPostId") REFERENCES "SlackPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "photoEntryId" TEXT NOT NULL,
    "slackUserId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "reactedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reaction_photoEntryId_fkey" FOREIGN KEY ("photoEntryId") REFERENCES "PhotoEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reaction_slackUserId_fkey" FOREIGN KEY ("slackUserId") REFERENCES "User" ("slackId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UniqueVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "photoEntryId" TEXT NOT NULL,
    "slackUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UniqueVote_photoEntryId_fkey" FOREIGN KEY ("photoEntryId") REFERENCES "PhotoEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UniqueVote_slackUserId_fkey" FOREIGN KEY ("slackUserId") REFERENCES "User" ("slackId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScoringConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "votingWeight" REAL NOT NULL DEFAULT 70,
    "organizerWeight" REAL NOT NULL DEFAULT 30,
    "maxOrganizerScore" REAL NOT NULL DEFAULT 10,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emoji" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "messagesProcessed" INTEGER NOT NULL DEFAULT 0,
    "photosFound" INTEGER NOT NULL DEFAULT 0,
    "newPhotos" INTEGER NOT NULL DEFAULT 0,
    "reactionsUpdated" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "duration" INTEGER
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "slackChannelId" TEXT NOT NULL DEFAULT '',
    "slackChannelName" TEXT NOT NULL DEFAULT '#vrdc-thailandtrip',
    "contestName" TEXT NOT NULL DEFAULT 'Capture the Trip!',
    "submissionDeadline" DATETIME,
    "votingDeadline" DATETIME,
    "resultAnnouncementDate" DATETIME,
    "autoSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoSyncInterval" INTEGER NOT NULL DEFAULT 300,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_slackId_key" ON "User"("slackId");

-- CreateIndex
CREATE UNIQUE INDEX "SlackPost_slackMessageTs_key" ON "SlackPost"("slackMessageTs");

-- CreateIndex
CREATE INDEX "PhotoEntry_slackPostId_idx" ON "PhotoEntry"("slackPostId");

-- CreateIndex
CREATE INDEX "PhotoEntry_finalScore_idx" ON "PhotoEntry"("finalScore");

-- CreateIndex
CREATE INDEX "Reaction_photoEntryId_idx" ON "Reaction"("photoEntryId");

-- CreateIndex
CREATE INDEX "Reaction_slackUserId_idx" ON "Reaction"("slackUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_photoEntryId_slackUserId_emoji_key" ON "Reaction"("photoEntryId", "slackUserId", "emoji");

-- CreateIndex
CREATE INDEX "UniqueVote_photoEntryId_idx" ON "UniqueVote"("photoEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "UniqueVote_photoEntryId_slackUserId_key" ON "UniqueVote"("photoEntryId", "slackUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
