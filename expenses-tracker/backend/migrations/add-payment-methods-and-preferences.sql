-- Migration: Add PaymentMethod and UserPreference tables
-- Date: 2024-01-XX
-- Description: Adds support for user-defined payment methods and user preferences

-- Add PaymentMethod table
CREATE TABLE IF NOT EXISTS "PaymentMethod" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Add UserPreference table
CREATE TABLE IF NOT EXISTS "UserPreference" (
    "id" SERIAL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Add unique constraint for user preferences (one value per key per user)
CREATE UNIQUE INDEX IF NOT EXISTS "UserPreference_userId_key_key" ON "UserPreference"("userId", "key");

-- Add paymentMethodId column to Expense table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Expense' AND column_name = 'paymentMethodId'
    ) THEN
        ALTER TABLE "Expense" ADD COLUMN "paymentMethodId" INTEGER;
        ALTER TABLE "Expense" ADD CONSTRAINT "Expense_paymentMethodId_fkey" 
            FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id");
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "PaymentMethod_userId_idx" ON "PaymentMethod"("userId");
CREATE INDEX IF NOT EXISTS "UserPreference_userId_idx" ON "UserPreference"("userId");
CREATE INDEX IF NOT EXISTS "Expense_paymentMethodId_idx" ON "Expense"("paymentMethodId");

-- Insert some default payment methods for existing users (optional)
-- This can be run manually if needed
/*
INSERT INTO "PaymentMethod" ("name", "icon", "color", "userId", "createdAt", "updatedAt")
SELECT 
    'Cash',
    'cash',
    '#4CAF50',
    u.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User" u
WHERE NOT EXISTS (
    SELECT 1 FROM "PaymentMethod" pm 
    WHERE pm."userId" = u.id AND pm."name" = 'Cash'
);
*/
