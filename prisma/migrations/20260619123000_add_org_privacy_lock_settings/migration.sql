-- CreateEnum
CREATE TYPE "PrivacyLockModule" AS ENUM ('hr', 'accounting');

-- CreateTable
CREATE TABLE "OrgPrivacyLockSetting" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "module" "PrivacyLockModule" NOT NULL,
    "pinHash" TEXT NOT NULL,
    "pinVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,
    "lastRotatedAt" TIMESTAMP(3),
    "lastRotatedByUserId" TEXT,

    CONSTRAINT "OrgPrivacyLockSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgPrivacyLockSetting_orgId_module_key" ON "OrgPrivacyLockSetting"("orgId", "module");

-- CreateIndex
CREATE INDEX "OrgPrivacyLockSetting_orgId_idx" ON "OrgPrivacyLockSetting"("orgId");

-- AddForeignKey
ALTER TABLE "OrgPrivacyLockSetting" ADD CONSTRAINT "OrgPrivacyLockSetting_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgPrivacyLockSetting" ADD CONSTRAINT "OrgPrivacyLockSetting_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgPrivacyLockSetting" ADD CONSTRAINT "OrgPrivacyLockSetting_lastRotatedByUserId_fkey" FOREIGN KEY ("lastRotatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
