/*
  Warnings:

  - Added the required column `challenge_id` to the `detections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time_to_solve` to the `detections` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "detections" ADD COLUMN     "challenge_id" TEXT NOT NULL,
ADD COLUMN     "time_to_solve" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "ChallengeBank" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "difficulty_level" INTEGER NOT NULL,

    CONSTRAINT "ChallengeBank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeBank_value_key" ON "ChallengeBank"("value");

-- AddForeignKey
ALTER TABLE "detections" ADD CONSTRAINT "detections_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "ChallengeBank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
