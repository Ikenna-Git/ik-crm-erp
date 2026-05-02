ALTER TABLE "Org"
ADD COLUMN "billingPlan" TEXT NOT NULL DEFAULT 'trial',
ADD COLUMN "billingStatus" TEXT NOT NULL DEFAULT 'trial',
ADD COLUMN "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
ADD COLUMN "billingEmail" TEXT,
ADD COLUMN "seatLimit" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN "nextBillingDate" TIMESTAMP(3),
ADD COLUMN "trialEndsAt" TIMESTAMP(3),
ADD COLUMN "paymentProvider" TEXT,
ADD COLUMN "paymentCustomerRef" TEXT,
ADD COLUMN "paymentSubscriptionRef" TEXT;
