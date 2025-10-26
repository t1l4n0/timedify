/*
  Warnings:

  - You are about to drop the column `valueMs` on the `web_vital_events` table. All the data in the column will be lost.
  - Added the required column `value` to the `web_vital_events` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "session_token_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "shopHash" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_web_vital_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ts" DATETIME NOT NULL,
    "kind" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "rating" TEXT NOT NULL,
    "navigationType" TEXT,
    "path" TEXT,
    "clientHash" TEXT NOT NULL
);
INSERT INTO "new_web_vital_events" ("clientHash", "createdAt", "id", "kind", "navigationType", "path", "rating", "ts") SELECT "clientHash", "createdAt", "id", "kind", "navigationType", "path", "rating", "ts" FROM "web_vital_events";
DROP TABLE "web_vital_events";
ALTER TABLE "new_web_vital_events" RENAME TO "web_vital_events";
CREATE INDEX "web_vital_events_kind_ts_idx" ON "web_vital_events"("kind", "ts");
CREATE INDEX "web_vital_events_rating_ts_idx" ON "web_vital_events"("rating", "ts");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "session_token_events_createdAt_idx" ON "session_token_events"("createdAt");

-- CreateIndex
CREATE INDEX "session_token_events_success_createdAt_idx" ON "session_token_events"("success", "createdAt");
