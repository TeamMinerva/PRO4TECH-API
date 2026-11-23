/*
  Warnings:

  - The `skills` column on the `Developer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `technologies` column on the `Project` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Developer" DROP COLUMN "skills",
ADD COLUMN     "skills" TEXT[];

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "technologies",
ADD COLUMN     "technologies" TEXT[];
