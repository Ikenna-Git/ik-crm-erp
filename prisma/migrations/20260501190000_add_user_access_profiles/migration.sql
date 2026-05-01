CREATE TYPE "AccessProfile" AS ENUM (
  'GENERAL',
  'SALES',
  'MARKETING',
  'SUPPORT',
  'FINANCE',
  'HR',
  'OPERATIONS',
  'PROJECT_MANAGER',
  'INVENTORY',
  'EXECUTIVE',
  'ADMINISTRATION'
);

ALTER TABLE "User"
ADD COLUMN "accessProfile" "AccessProfile" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN "moduleAccess" JSONB;

UPDATE "User"
SET "accessProfile" = CASE
  WHEN "role" = 'SUPER_ADMIN' THEN 'ADMINISTRATION'::"AccessProfile"
  WHEN "role" = 'ORG_OWNER' THEN 'EXECUTIVE'::"AccessProfile"
  WHEN "role" = 'ADMIN' THEN 'ADMINISTRATION'::"AccessProfile"
  ELSE 'GENERAL'::"AccessProfile"
END
WHERE "accessProfile" = 'GENERAL'::"AccessProfile";
