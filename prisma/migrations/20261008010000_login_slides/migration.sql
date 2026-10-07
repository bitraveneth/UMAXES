-- Login / register carousel slides managed in admin
CREATE TABLE "LoginSlide" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginSlide_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LoginSlide_active_sortOrder_idx" ON "LoginSlide"("active", "sortOrder");
