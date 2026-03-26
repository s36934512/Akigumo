/*
  Warnings:

  - You are about to drop the column `title` on the `item` table. All the data in the column will be lost.
  - Added the required column `name` to the `item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `correlation_id` to the `outbox` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "item" DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "outbox" ADD COLUMN     "correlation_id" TEXT NOT NULL,
ADD COLUMN     "last_error" TEXT,
ADD COLUMN     "workflow_id" TEXT;

-- AlterTable
ALTER TABLE "workflow_state" ADD COLUMN     "data_pool" JSONB,
ADD COLUMN     "tasks" JSONB;
