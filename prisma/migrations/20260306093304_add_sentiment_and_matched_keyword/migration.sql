-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL');

-- AlterTable
ALTER TABLE "BrandMention" ADD COLUMN     "matchedKeyword" TEXT,
ADD COLUMN     "sentiment" "Sentiment" NOT NULL DEFAULT 'NEUTRAL';

-- CreateIndex
CREATE INDEX "BrandMention_projectId_sentiment_idx" ON "BrandMention"("projectId", "sentiment");

-- CreateIndex
CREATE INDEX "BrandMention_projectId_matchedKeyword_idx" ON "BrandMention"("projectId", "matchedKeyword");
