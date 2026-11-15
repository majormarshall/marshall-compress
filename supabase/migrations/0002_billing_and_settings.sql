-- ============================================================================
-- MARSHALL SaaS Platform - Phase 2 Billing, User Settings & Performance Indexes
-- Migration: 0002_billing_and_settings.sql
-- ============================================================================

-- 1. Index optimizations for billing and Stripe lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
    ON subscriptions(stripe_customer_id)
    WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id
    ON subscriptions(stripe_subscription_id)
    WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
    ON subscriptions(user_id, status);

-- 2. Index optimizations for files hierarchy and user folder traversal
CREATE INDEX IF NOT EXISTS idx_files_user_folder_active
    ON files(user_id, folder_id, status)
    WHERE status != 'DELETED';

CREATE INDEX IF NOT EXISTS idx_files_user_mime_created
    ON files(user_id, mime_type, created_at DESC);

-- 3. Compression jobs lookup optimizations
CREATE INDEX IF NOT EXISTS idx_compression_jobs_user_status
    ON compression_jobs(user_id, status, created_at DESC);

-- 4. User profile settings preferences column (safe JSONB extension)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'preferences'
    ) THEN
        ALTER TABLE profiles ADD COLUMN preferences JSONB DEFAULT '{"theme":"system","emailNotifications":true,"compressionPreset":"BALANCED"}'::jsonb;
    END IF;
END $$;
