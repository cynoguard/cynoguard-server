/*
  Warnings:

  - You are about to drop the column `connection_verified` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `challenge_history` on the `detections` table. All the data in the column will be lost.
  - Added the required column `risk_level` to the `detections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_agent` to the `detections` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('DESKTOP', 'MOBILE', 'TABLET', 'BOT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "api_keys" DROP COLUMN "connection_verified";

-- AlterTable
ALTER TABLE "detections" DROP COLUMN "challenge_history",
ADD COLUMN     "challenge_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "challenge_solved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country_code" TEXT,
ADD COLUMN     "device_type" "DeviceType" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "is_headless" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "risk_level" "RiskLevel" NOT NULL,
ADD COLUMN     "session_id" TEXT,
ADD COLUMN     "user_agent" TEXT NOT NULL,
ALTER COLUMN "time_to_solve" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "challenge_attempts" (
    "id" TEXT NOT NULL,
    "detection_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answered_at" TIMESTAMP(3),
    "success" BOOLEAN NOT NULL,
    "time_to_solve" INTEGER,

    CONSTRAINT "challenge_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "challenge_attempts_detection_id_idx" ON "challenge_attempts"("detection_id");

-- CreateIndex
CREATE INDEX "challenge_attempts_challenge_id_idx" ON "challenge_attempts"("challenge_id");

-- CreateIndex
CREATE INDEX "detections_project_id_created_at_idx" ON "detections"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "detections_project_id_action_idx" ON "detections"("project_id", "action");

-- CreateIndex
CREATE INDEX "detections_project_id_country_code_idx" ON "detections"("project_id", "country_code");

-- CreateIndex
CREATE INDEX "detections_project_id_is_human_idx" ON "detections"("project_id", "is_human");

-- CreateIndex
CREATE INDEX "detections_session_id_idx" ON "detections"("session_id");

-- CreateIndex
CREATE INDEX "detections_ip_address_idx" ON "detections"("ip_address");

-- AddForeignKey
ALTER TABLE "challenge_attempts" ADD CONSTRAINT "challenge_attempts_detection_id_fkey" FOREIGN KEY ("detection_id") REFERENCES "detections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_attempts" ADD CONSTRAINT "challenge_attempts_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge_bank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
