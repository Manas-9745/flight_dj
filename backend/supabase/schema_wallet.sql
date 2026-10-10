-- =====================================================================
-- AeroMate (PS-01) Secure Travel Wallet — Supabase Database Migration
-- =====================================================================

-- 1. Create Travel Wallet Documents Table
CREATE TABLE IF NOT EXISTS public.travel_wallet_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('identity', 'travel', 'medical', 'other')),
    doc_type TEXT NOT NULL,
    issuing_country TEXT DEFAULT 'IND',
    expiry_date DATE,
    trip_id TEXT,
    flight_details JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    files JSONB NOT NULL DEFAULT '[]'::jsonb,
    masked_number TEXT,
    is_offline_available BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create Indexes for High Performance Queries
CREATE INDEX IF NOT EXISTS idx_wallet_user_id ON public.travel_wallet_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_category ON public.travel_wallet_documents(category);
CREATE INDEX IF NOT EXISTS idx_wallet_expiry ON public.travel_wallet_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_wallet_created_at ON public.travel_wallet_documents(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.travel_wallet_documents ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies (Users can ONLY view, insert, update, delete their own documents)
CREATE POLICY "Users can view only their own wallet documents"
    ON public.travel_wallet_documents
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet documents"
    ON public.travel_wallet_documents
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own wallet documents"
    ON public.travel_wallet_documents
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own wallet documents"
    ON public.travel_wallet_documents
    FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Auto-Update Timestamp Trigger
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wallet_timestamp ON public.travel_wallet_documents;
CREATE TRIGGER trigger_update_wallet_timestamp
    BEFORE UPDATE ON public.travel_wallet_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_timestamp();

-- 6. Setup Supabase Storage Bucket for Encrypted Wallet Files (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'wallet_documents',
    'wallet_documents',
    false, -- STRICTLY PRIVATE
    10485760, -- 10MB limit per file
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760;

-- 7. Storage Bucket Access Policies (RLS)
CREATE POLICY "Users can view only their own uploaded wallet files"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'wallet_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own wallet files"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'wallet_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own wallet files"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'wallet_documents' AND auth.uid()::text = (storage.foldername(name))[1]);
