-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('REDDIT');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MentionStatus" AS ENUM ('NEW', 'VIEWED', 'DISMISSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "SocialHandler" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL DEFAULT 'REDDIT',
    "bearerTokenEncrypted" TEXT NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "lastValidatedAt" TIMESTAMP(3),
    "validationError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialHandler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringKeyword" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitoringKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandMention" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL DEFAULT 'REDDIT',
    "externalId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorUsername" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "tweetUrl" TEXT,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "retweetCount" INTEGER NOT NULL DEFAULT 0,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "riskFlags" TEXT[],
    "status" "MentionStatus" NOT NULL DEFAULT 'NEW',
    "publishedAt" TIMESTAMP(3),
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL DEFAULT 'REDDIT',
    "scanStatus" "ScanStatus" NOT NULL DEFAULT 'SUCCESS',
    "mentionsFound" INTEGER NOT NULL DEFAULT 0,
    "highRiskCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialHandler_projectId_idx" ON "SocialHandler"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialHandler_projectId_platform_key" ON "SocialHandler"("projectId", "platform");

-- CreateIndex
CREATE INDEX "MonitoringKeyword_projectId_idx" ON "MonitoringKeyword"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringKeyword_projectId_keyword_key" ON "MonitoringKeyword"("projectId", "keyword");

-- CreateIndex
CREATE INDEX "BrandMention_projectId_riskLevel_idx" ON "BrandMention"("projectId", "riskLevel");

-- CreateIndex
CREATE INDEX "BrandMention_projectId_status_idx" ON "BrandMention"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BrandMention_projectId_externalId_key" ON "BrandMention"("projectId", "externalId");

-- CreateIndex
CREATE INDEX "ScanLog_projectId_idx" ON "ScanLog"("projectId");

-- AddForeignKey
ALTER TABLE "SocialHandler" ADD CONSTRAINT "SocialHandler_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringKeyword" ADD CONSTRAINT "MonitoringKeyword_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandMention" ADD CONSTRAINT "BrandMention_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanLog" ADD CONSTRAINT "ScanLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
