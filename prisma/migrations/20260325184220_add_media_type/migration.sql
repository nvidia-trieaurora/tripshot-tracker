-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PhotoEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slackPostId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "mediaType" TEXT NOT NULL DEFAULT 'image',
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
INSERT INTO "new_PhotoEntry" ("caption", "categoryTags", "createdAt", "finalScore", "id", "imageIndex", "imageUrl", "isFeatured", "organizerCreativity", "organizerEmotion", "organizerNotes", "organizerScore", "organizerStorytelling", "slackPostId", "teamVotingScore", "thumbnailUrl", "trendingScore", "updatedAt") SELECT "caption", "categoryTags", "createdAt", "finalScore", "id", "imageIndex", "imageUrl", "isFeatured", "organizerCreativity", "organizerEmotion", "organizerNotes", "organizerScore", "organizerStorytelling", "slackPostId", "teamVotingScore", "thumbnailUrl", "trendingScore", "updatedAt" FROM "PhotoEntry";
DROP TABLE "PhotoEntry";
ALTER TABLE "new_PhotoEntry" RENAME TO "PhotoEntry";
CREATE INDEX "PhotoEntry_slackPostId_idx" ON "PhotoEntry"("slackPostId");
CREATE INDEX "PhotoEntry_finalScore_idx" ON "PhotoEntry"("finalScore");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
