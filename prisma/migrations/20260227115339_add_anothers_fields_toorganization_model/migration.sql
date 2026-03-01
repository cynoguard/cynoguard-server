/*
  Warnings:

  - You are about to drop the column `challenge_id` on the `detections` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "detections" DROP COLUMN "challenge_id",
ADD COLUMN     "challenge_history" TEXT[];

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "business_type" TEXT,
ADD COLUMN     "primary_uses" TEXT,
ADD COLUMN     "team_size" TEXT;
