-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "memberships_walletAddress_key" ON "memberships"("walletAddress");
