ALTER TABLE "Org"
ADD COLUMN "logoUrl" TEXT,
ADD COLUMN "logoPublicId" TEXT,
ADD COLUMN "industry" TEXT,
ADD COLUMN "operatingTemplate" TEXT,
ADD COLUMN "legalBusinessName" TEXT,
ADD COLUMN "tradingName" TEXT,
ADD COLUMN "businessEmail" TEXT,
ADD COLUMN "businessPhone" TEXT,
ADD COLUMN "businessAddress" TEXT,
ADD COLUMN "taxNumber" TEXT,
ADD COLUMN "companyRegistrationNumber" TEXT,
ADD COLUMN "defaultInvoiceTerms" TEXT,
ADD COLUMN "defaultInvoiceNotes" TEXT,
ADD COLUMN "paymentInstructions" TEXT;

ALTER TABLE "Invoice"
ADD COLUMN "documentIdentitySnapshot" JSONB;
