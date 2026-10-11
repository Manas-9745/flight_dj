-- ==============================================================================
-- AeroMate — Baggage Tracking & Recovery Migration (PostgreSQL / Supabase)
-- ==============================================================================

-- 1. BAGGAGE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.baggage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    booking_reference VARCHAR(32),
    passenger_name TEXT NOT NULL,
    flight_number VARCHAR(16) NOT NULL,
    origin VARCHAR(8) NOT NULL,
    destination VARCHAR(8) NOT NULL,
    tag_number VARCHAR(64) NOT NULL,
    description TEXT,
    photo_url TEXT,
    status VARCHAR(64) NOT NULL DEFAULT 'Registered',
    last_known_location TEXT,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_simulated BOOLEAN DEFAULT true,
    is_verified_booking BOOLEAN DEFAULT false,
    pir_reference VARCHAR(64),
    recovery_status VARCHAR(64),
    recovery_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. BAGGAGE STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.baggage_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baggage_id UUID NOT NULL REFERENCES public.baggage_records(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(64) NOT NULL,
    location TEXT,
    update_source VARCHAR(64) NOT NULL DEFAULT 'user_manual',
    notes TEXT,
    is_simulated BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_baggage_records_user_id ON public.baggage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_baggage_records_tag_number ON public.baggage_records(tag_number);
CREATE INDEX IF NOT EXISTS idx_baggage_records_flight ON public.baggage_records(flight_number);
CREATE INDEX IF NOT EXISTS idx_baggage_history_baggage_id ON public.baggage_status_history(baggage_id);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.baggage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baggage_status_history ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DROP POLICY IF EXISTS "Users can view their own baggage records" ON public.baggage_records;
DROP POLICY IF EXISTS "Users can insert their own baggage records" ON public.baggage_records;
DROP POLICY IF EXISTS "Users can update their own baggage records" ON public.baggage_records;
DROP POLICY IF EXISTS "Users can delete their own baggage records" ON public.baggage_records;

DROP POLICY IF EXISTS "Users can view their own baggage status history" ON public.baggage_status_history;
DROP POLICY IF EXISTS "Users can insert their own baggage status history" ON public.baggage_status_history;

-- BAGGAGE RECORDS POLICIES
CREATE POLICY "Users can view their own baggage records"
    ON public.baggage_records FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own baggage records"
    ON public.baggage_records FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own baggage records"
    ON public.baggage_records FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own baggage records"
    ON public.baggage_records FOR DELETE USING (auth.uid() = user_id);

-- BAGGAGE STATUS HISTORY POLICIES
CREATE POLICY "Users can view their own baggage status history"
    ON public.baggage_status_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own baggage status history"
    ON public.baggage_status_history FOR INSERT WITH CHECK (auth.uid() = user_id);
