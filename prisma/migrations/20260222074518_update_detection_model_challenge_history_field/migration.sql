/*
  Warnings:

  - The `challenge_id` column on the `detections` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "detections" DROP CONSTRAINT "detections_challenge_id_fkey";

-- AlterTable
ALTER TABLE "detections" DROP COLUMN "challenge_id",
ADD COLUMN     "challenge_id" TEXT[];
