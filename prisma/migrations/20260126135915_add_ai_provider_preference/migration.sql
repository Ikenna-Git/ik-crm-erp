-- CreateEnum
CREATE TYPE "CrmEntity" AS ENUM ('CONTACT', 'COMPANY', 'DEAL');

-- CreateEnum
CREATE TYPE "CrmFieldType" AS ENUM ('TEXT', 'NUMBER', 'CURRENCY', 'DATE', 'SELECT', 'MULTISELECT', 'CHECKBOX');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "customFields" JSONB;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "customFields" JSONB;

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "customFields" JSONB;

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "aiProvider" TEXT NOT NULL DEFAULT 'auto',
ADD COLUMN     "crmCompanyView" JSONB,
ADD COLUMN     "crmContactView" JSONB,
ADD COLUMN     "crmDealView" JSONB;

-- CreateTable
CREATE TABLE "CrmField" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "entity" "CrmEntity" NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "CrmFieldType" NOT NULL,
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrmField_orgId_entity_idx" ON "CrmField"("orgId", "entity");

-- CreateIndex
CREATE UNIQUE INDEX "CrmField_orgId_entity_key_key" ON "CrmField"("orgId", "entity", "key");

-- AddForeignKey
ALTER TABLE "CrmField" ADD CONSTRAINT "CrmField_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
