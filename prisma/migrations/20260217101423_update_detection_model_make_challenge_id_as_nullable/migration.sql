-- DropForeignKey
ALTER TABLE "detections" DROP CONSTRAINT "detections_challenge_id_fkey";

-- AlterTable
ALTER TABLE "detections" ALTER COLUMN "challenge_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "detections" ADD CONSTRAINT "detections_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge_bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;
