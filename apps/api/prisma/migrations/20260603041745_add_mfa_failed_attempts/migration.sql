-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mfaFailedAttempts" INTEGER NOT NULL DEFAULT 0;
