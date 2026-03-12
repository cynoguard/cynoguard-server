/*
  Warnings:

  - The values [REDDIT] on the enum `Platform` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Platform_new" AS ENUM ('X');
ALTER TABLE "public"."BrandMention" ALTER COLUMN "platform" DROP DEFAULT;
ALTER TABLE "public"."ScanLog" ALTER COLUMN "platform" DROP DEFAULT;
ALTER TABLE "public"."SocialHandler" ALTER COLUMN "platform" DROP DEFAULT;
ALTER TABLE "SocialHandler" ALTER COLUMN "platform" TYPE "Platform_new" USING ("platform"::text::"Platform_new");
ALTER TABLE "BrandMention" ALTER COLUMN "platform" TYPE "Platform_new" USING ("platform"::text::"Platform_new");
ALTER TABLE "ScanLog" ALTER COLUMN "platform" TYPE "Platform_new" USING ("platform"::text::"Platform_new");
ALTER TYPE "Platform" RENAME TO "Platform_old";
ALTER TYPE "Platform_new" RENAME TO "Platform";
DROP TYPE "public"."Platform_old";
ALTER TABLE "BrandMention" ALTER COLUMN "platform" SET DEFAULT 'X';
ALTER TABLE "ScanLog" ALTER COLUMN "platform" SET DEFAULT 'X';
ALTER TABLE "SocialHandler" ALTER COLUMN "platform" SET DEFAULT 'X';
COMMIT;

-- AlterTable
ALTER TABLE "BrandMention" ALTER COLUMN "platform" SET DEFAULT 'X';

-- AlterTable
ALTER TABLE "ScanLog" ALTER COLUMN "platform" SET DEFAULT 'X';

-- AlterTable
ALTER TABLE "SocialHandler" ALTER COLUMN "platform" SET DEFAULT 'X';
