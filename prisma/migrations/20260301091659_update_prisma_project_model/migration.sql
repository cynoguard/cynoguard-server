/*
  Warnings:

  - Added the required column `environment` to the `projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primary_domain` to the `projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `projects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "environment" TEXT NOT NULL,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "primary_domain" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
