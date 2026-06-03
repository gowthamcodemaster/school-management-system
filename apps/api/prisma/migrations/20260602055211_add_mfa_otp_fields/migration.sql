-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailOtpCode" TEXT,
ADD COLUMN     "emailOtpExpiry" TIMESTAMP(3),
ADD COLUMN     "emailOtpSentAt" TIMESTAMP(3),
ADD COLUMN     "lastUsedMfaCode" TEXT;
