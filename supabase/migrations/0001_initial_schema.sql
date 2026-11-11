-- ============================================================================
-- MARSHALL SaaS Platform - Comprehensive Initial Database Schema
-- Migration: 0001_initial_schema.sql
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- 2. Create Custom ENUM Types
CREATE TYPE user_role AS ENUM ('FREE', 'PRO', 'BUSINESS', 'ADMIN');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'TRIALING');
CREATE TYPE file_status AS ENUM ('UPLOADING', 'ACTIVE', 'DELETED', 'QUARANTINED');
CREATE TYPE file_type AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'PDF', 'DOCUMENT', 'ARCHIVE', 'OTHER');
CREATE TYPE job_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE compression_preset AS ENUM ('FAST', 'BALANCED', 'MAXIMUM');
CREATE TYPE meeting_status AS ENUM ('SCHEDULED', 'RECORDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE action_item_status AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE');
CREATE TYPE note_status AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE ai_provider AS ENUM ('OPENAI', 'GOOGLE', 'ANTHROPIC');
CREATE TYPE ai_job_type AS ENUM ('SUMMARIZE', 'TRANSCRIBE', 'QA', 'ORGANIZE');

-- ============================================================================
-- 3. Create Tables
-- ============================================================================

-- Table 1: profiles (Extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'FREE',
    storage_used_bytes BIGINT NOT NULL DEFAULT 0,
    storage_limit_bytes BIGINT NOT NULL DEFAULT 5368709120, -- 5 GB default
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 2: subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan user_role NOT NULL DEFAULT 'FREE',
    status subscription_status NOT NULL DEFAULT 'TRIALING',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 3: folders (Hierarchical folder tree)
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 4: files
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    file_type file_type NOT NULL,
    status file_status NOT NULL DEFAULT 'ACTIVE',
    storage_key TEXT UNIQUE NOT NULL,
    storage_url TEXT,
    thumbnail_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Table 5: compression_jobs
CREATE TABLE compression_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    status job_status NOT NULL DEFAULT 'PENDING',
    preset compression_preset NOT NULL DEFAULT 'BALANCED',
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 6: compressed_files
CREATE TABLE compressed_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID UNIQUE NOT NULL REFERENCES compression_jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    original_file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_key TEXT UNIQUE NOT NULL,
    storage_url TEXT,
    compression_ratio NUMERIC(5,2),
    time_taken_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 7: meetings
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status meeting_status NOT NULL DEFAULT 'SCHEDULED',
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    external_id TEXT,
    external_platform TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 8: meeting_participants
CREATE TABLE meeting_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    role TEXT,
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ
);

-- Table 9: recordings
CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    storage_key TEXT,
    duration_seconds INTEGER,
    size_bytes BIGINT,
    status job_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 10: transcripts
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID UNIQUE NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    recording_id UUID REFERENCES recordings(id) ON DELETE SET NULL,
    ai_provider ai_provider,
    language TEXT NOT NULL DEFAULT 'en',
    word_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 11: transcript_segments
CREATE TABLE transcript_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    speaker_label TEXT,
    start_time NUMERIC NOT NULL DEFAULT 0,
    end_time NUMERIC NOT NULL DEFAULT 0,
    text TEXT NOT NULL,
    confidence NUMERIC(4,3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 12: meeting_notes (Tiptap JSON content)
CREATE TABLE meeting_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    word_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 13: action_items
CREATE TABLE action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assignee_name TEXT,
    description TEXT NOT NULL,
    status action_item_status NOT NULL DEFAULT 'OPEN',
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 14: notes (Tiptap JSON content with full-text search)
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    status note_status NOT NULL DEFAULT 'DRAFT',
    word_count INTEGER NOT NULL DEFAULT 0,
    tags TEXT[] NOT NULL DEFAULT '{}'::text[],
    pinned BOOLEAN NOT NULL DEFAULT false,
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content->>'text', ''))
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Table 15: integrations
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- e.g. 'zoom', 'google', 'notion'
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_integrations_user_platform UNIQUE (user_id, platform)
);

-- Table 16: notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 17: usage_records
CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_id UUID,
    bytes_processed BIGINT NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 18: ai_jobs
CREATE TABLE ai_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    job_type ai_job_type NOT NULL,
    provider ai_provider NOT NULL,
    status job_status NOT NULL DEFAULT 'PENDING',
    resource_type TEXT,
    resource_id UUID,
    input JSONB,
    output JSONB,
    tokens_used INTEGER,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 19: audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 20: webhook_events
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT false,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ
);

-- ============================================================================
-- 4. Indexes for Performance & Query Optimization
-- ============================================================================

-- profiles
CREATE INDEX idx_profiles_role ON profiles(role);

-- subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- folders
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);

-- files
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_folder_id ON files(folder_id);
CREATE INDEX idx_files_status ON files(status);
CREATE INDEX idx_files_file_type ON files(file_type);
CREATE INDEX idx_files_created_at_desc ON files(created_at DESC);
CREATE INDEX idx_files_deleted_at ON files(deleted_at) WHERE deleted_at IS NOT NULL;

-- compression_jobs
CREATE INDEX idx_compression_jobs_user_id ON compression_jobs(user_id);
CREATE INDEX idx_compression_jobs_file_id ON compression_jobs(file_id);
CREATE INDEX idx_compression_jobs_status ON compression_jobs(status);
CREATE INDEX idx_compression_jobs_created_at_desc ON compression_jobs(created_at DESC);

-- compressed_files
CREATE INDEX idx_compressed_files_job_id ON compressed_files(job_id);
CREATE INDEX idx_compressed_files_user_id ON compressed_files(user_id);
CREATE INDEX idx_compressed_files_original_file_id ON compressed_files(original_file_id);

-- meetings
CREATE INDEX idx_meetings_user_id ON meetings(user_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_scheduled_at_desc ON meetings(scheduled_at DESC);

-- meeting_participants
CREATE INDEX idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_email ON meeting_participants(email);

-- recordings
CREATE INDEX idx_recordings_meeting_id ON recordings(meeting_id);
CREATE INDEX idx_recordings_user_id ON recordings(user_id);
CREATE INDEX idx_recordings_file_id ON recordings(file_id);
CREATE INDEX idx_recordings_status ON recordings(status);

-- transcripts
CREATE INDEX idx_transcripts_meeting_id ON transcripts(meeting_id);
CREATE INDEX idx_transcripts_recording_id ON transcripts(recording_id);

-- transcript_segments
CREATE INDEX idx_transcript_segments_transcript_id ON transcript_segments(transcript_id);
CREATE INDEX idx_transcript_segments_start_time ON transcript_segments(transcript_id, start_time);

-- meeting_notes
CREATE INDEX idx_meeting_notes_meeting_id ON meeting_notes(meeting_id);
CREATE INDEX idx_meeting_notes_user_id ON meeting_notes(user_id);

-- action_items
CREATE INDEX idx_action_items_meeting_id ON action_items(meeting_id);
CREATE INDEX idx_action_items_user_id ON action_items(user_id);
CREATE INDEX idx_action_items_status ON action_items(status);
CREATE INDEX idx_action_items_due_date ON action_items(due_date);

-- notes
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_folder_id ON notes(folder_id);
CREATE INDEX idx_notes_status ON notes(status);
CREATE INDEX idx_notes_pinned ON notes(user_id, pinned) WHERE pinned = true;
CREATE INDEX idx_notes_created_at_desc ON notes(created_at DESC);
CREATE INDEX idx_notes_deleted_at ON notes(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_notes_search_vector ON notes USING GIN (search_vector);
CREATE INDEX idx_notes_tags ON notes USING GIN (tags);

-- integrations
CREATE INDEX idx_integrations_user_id ON integrations(user_id);

-- notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at_desc ON notifications(created_at DESC);

-- usage_records
CREATE INDEX idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX idx_usage_records_action ON usage_records(user_id, action);
CREATE INDEX idx_usage_records_created_at_desc ON usage_records(created_at DESC);

-- ai_jobs
CREATE INDEX idx_ai_jobs_user_id ON ai_jobs(user_id);
CREATE INDEX idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX idx_ai_jobs_job_type ON ai_jobs(job_type);
CREATE INDEX idx_ai_jobs_created_at_desc ON ai_jobs(created_at DESC);

-- audit_logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at_desc ON audit_logs(created_at DESC);

-- webhook_events
CREATE INDEX idx_webhook_events_source_type ON webhook_events(source, event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed) WHERE processed = false;

-- ============================================================================
-- 5. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE compression_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compressed_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- 5.1 profiles
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 5.2 subscriptions
CREATE POLICY "Users can view their own subscriptions"
    ON subscriptions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 5.3 folders
CREATE POLICY "Users can view their own folders"
    ON folders FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders"
    ON folders FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
    ON folders FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
    ON folders FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5.4 files
CREATE POLICY "Users can view their own files"
    ON files FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files"
    ON files FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files"
    ON files FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
    ON files FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5.5 compression_jobs
CREATE POLICY "Users can view their own compression jobs"
    ON compression_jobs FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own compression jobs"
    ON compression_jobs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own compression jobs"
    ON compression_jobs FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own compression jobs"
    ON compression_jobs FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5.6 compressed_files
CREATE POLICY "Users can view their own compressed files"
    ON compressed_files FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own compressed files"
    ON compressed_files FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5.7 meetings
CREATE POLICY "Users can view their own meetings"
    ON meetings FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meetings"
    ON meetings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meetings"
    ON meetings FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meetings"
    ON meetings FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5.8 meeting_participants
CREATE POLICY "Users can view participants of their meetings"
    ON meeting_participants FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM meetings
        WHERE meetings.id = meeting_participants.meeting_id
          AND meetings.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert participants for their meetings"
    ON meeting_participants FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM meetings
        WHERE meetings.id = meeting_participants.meeting_id
          AND meetings.user_id = auth.uid()
    ));

CREATE POLICY "Users can update participants of their meetings"
    ON meeting_participants FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM meetings
        WHERE meetings.id = meeting_participants.meeting_id
          AND meetings.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM meetings
        WHERE meetings.id = meeting_participants.meeting_id
          AND meetings.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete participants of their meetings"
    ON meeting_participants FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM meetings
        WHERE meetings.id = meeting_participants.meeting_id
          AND meetings.user_id = auth.uid()
    ));

-- 5.9 recordings
CREATE POLICY "Users can view their own recordings"
    ON recordings FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recordings"
    ON recordings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recordings"
    ON recordings FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recordings"
    ON recordings FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5.10 transcripts
CREATE POLICY "Users can view transcripts of their meetings"
    ON transcripts FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM meetings
        WHERE meetings.id = transcripts.meeting_id
          AND meetings.user_id = auth.uid()
    ));

-- 5.11 transcript_segments
CREATE POLICY "Users can view transcript segments of their meetings"
    ON transcript_segments FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM transcripts
        JOIN meetings ON meetings.id = transcripts.meeting_id
        WHERE transcripts.id = transcript_segments.transcript_id
          AND meetings.user_id = auth.uid()
    ));

-- 5.12 meeting_notes
CREATE POLICY "Users can view their own meeting notes"
    ON meeting_notes FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meeting notes"
    ON meeting_notes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meeting notes"
    ON meeting_notes FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meeting notes"
    ON meeting_notes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5.13 action_items
CREATE POLICY "Users can view their own action items"
    ON action_items FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own action items"
    ON action_items FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own action items"
    ON action_items FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own action items"
    ON action_items FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5.14 notes
CREATE POLICY "Users can view their own notes"
    ON notes FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
    ON notes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
    ON notes FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
    ON notes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5.15 integrations
CREATE POLICY "Users can view their own integrations"
    ON integrations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
    ON integrations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
    ON integrations FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
    ON integrations FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5.16 notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5.17 usage_records
CREATE POLICY "Users can view their own usage records"
    ON usage_records FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 5.18 ai_jobs
CREATE POLICY "Users can view their own ai jobs"
    ON ai_jobs FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai jobs"
    ON ai_jobs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ai jobs"
    ON ai_jobs FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5.19 audit_logs
CREATE POLICY "Users can view their own audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 5.20 webhook_events
-- Webhooks are system events processed via backend service-role key, no direct authenticated user access.
CREATE POLICY "Service role full access on webhook_events"
    ON webhook_events FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 6. Database Functions & Triggers
-- ============================================================================

-- Function 6.1: updated_at auto-updater
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger across all applicable tables
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_compression_jobs_updated_at
    BEFORE UPDATE ON compression_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_meetings_updated_at
    BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_recordings_updated_at
    BEFORE UPDATE ON recordings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_transcripts_updated_at
    BEFORE UPDATE ON transcripts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_meeting_notes_updated_at
    BEFORE UPDATE ON meeting_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_action_items_updated_at
    BEFORE UPDATE ON action_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function 6.2: Auto-create profile row on auth.users signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        avatar_url,
        role,
        storage_used_bytes,
        storage_limit_bytes,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'avatar_url',
        'FREE'::user_role,
        0,
        5368709120, -- 5GB default
        now(),
        now()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users for new signups
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function 6.3: Auto-update profiles.storage_used_bytes when files change
CREATE OR REPLACE FUNCTION update_user_storage_used()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_user_id := OLD.user_id;
    ELSE
        target_user_id := NEW.user_id;
    END IF;

    -- Recalculate total bytes for active (non-deleted) files
    UPDATE public.profiles
    SET storage_used_bytes = COALESCE(
        (
            SELECT SUM(size_bytes)
            FROM public.files
            WHERE user_id = target_user_id
              AND status != 'DELETED'
              AND deleted_at IS NULL
        ),
        0
    ),
    updated_at = now()
    WHERE id = target_user_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on files table to keep profile storage synced
CREATE TRIGGER trg_files_storage_sync
    AFTER INSERT OR UPDATE OF size_bytes, status, deleted_at OR DELETE ON files
    FOR EACH ROW EXECUTE FUNCTION update_user_storage_used();
