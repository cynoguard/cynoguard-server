/*
  Warnings:

  - You are about to drop the `ChallengeBank` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "detections" DROP CONSTRAINT "detections_challenge_id_fkey";

-- DropTable
DROP TABLE "ChallengeBank";

-- CreateTable
CREATE TABLE "challenge_bank" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "difficulty_level" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "challenge_bank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "challenge_bank_value_key" ON "challenge_bank"("value");

-- AddForeignKey
ALTER TABLE "detections" ADD CONSTRAINT "detections_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge_bank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
