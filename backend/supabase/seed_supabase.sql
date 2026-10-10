-- ==============================================================================
-- AeroMate (PS-01) — Robust Fail-Safe Supabase Seed Script
-- Target Account: d2025.manas.parekar@ves.ac.in
-- Instructions: Run this script in the Supabase SQL Editor.
-- ==============================================================================

-- 1. DROP EXISTING CONFLICTING TABLES IF ANY (Ensures clean schema initialization)
DROP TABLE IF EXISTS public.chat_history CASCADE;
DROP TABLE IF EXISTS public.saved_trips CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. CREATE PROFILES TABLE WITH UNIQUE EMAIL CONSTRAINT
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CREATE SAVED TRIPS TABLE
CREATE TABLE public.saved_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    flight_number VARCHAR(16) NOT NULL,
    airline VARCHAR(100),
    origin VARCHAR(8) NOT NULL,
    destination VARCHAR(8) NOT NULL,
    travel_date DATE NOT NULL,
    status VARCHAR(32) DEFAULT 'scheduled',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CREATE CHAT HISTORY TABLE
CREATE TABLE public.chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    flight_number VARCHAR(16),
    role VARCHAR(16) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable Row Level Security during initial data load
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history DISABLE ROW LEVEL SECURITY;

-- 5. INSERT SEED PROFILES
INSERT INTO public.profiles (id, email, full_name, preferred_language)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'd2025.manas.parekar@ves.ac.in', 'Manas Parekar', 'en'),
    ('a0000000-0000-0000-0000-000000000002', 'passenger@aeromate.io', 'Alex Mercer', 'en');

-- 6. INSERT SEED SAVED TRIPS
INSERT INTO public.saved_trips (id, user_id, flight_number, airline, origin, destination, travel_date, status, metadata)
VALUES
    (
        'b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'BA142',
        'British Airways',
        'LHR',
        'JFK',
        '2026-10-15',
        'delayed',
        '{"terminal": "5", "gate": "B36", "delayMinutes": 210, "compensationEligible": true}'::jsonb
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        'AI645',
        'Air India',
        'BOM',
        'DEL',
        '2026-10-18',
        'scheduled',
        '{"terminal": "2", "gate": "48", "seat": "12A"}'::jsonb
    ),
    (
        'b0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000001',
        '6E204',
        'IndiGo',
        'BOM',
        'BLR',
        '2026-10-20',
        'active',
        '{"terminal": "1", "gate": "15", "aircraft": "A320neo"}'::jsonb
    ),
    (
        'b0000000-0000-0000-0000-000000000004',
        'a0000000-0000-0000-0000-000000000001',
        'SQ423',
        'Singapore Airlines',
        'BOM',
        'SIN',
        '2026-10-25',
        'scheduled',
        '{"terminal": "2", "gate": "C12", "seat": "4B"}'::jsonb
    );

-- 7. INSERT SEED CHAT HISTORY LOGS
INSERT INTO public.chat_history (id, user_id, flight_number, role, content)
VALUES
    (
        'c0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'BA142',
        'user',
        'My flight BA142 is delayed by 3.5 hours. What are my rights under EU261?'
    ),
    (
        'c0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        'BA142',
        'assistant',
        'Under EU261/UK261 regulations for flight BA142 from LHR to JFK: You are entitled to £520 / €600 compensation per passenger for delays exceeding 3 hours. Additionally, British Airways must provide meal vouchers, drinks, and access to communications at Terminal 5.'
    );

-- 8. RE-ENABLE ROW LEVEL SECURITY WITH OPEN ACCESS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public select on saved_trips" ON public.saved_trips FOR SELECT USING (true);
CREATE POLICY "Allow public insert on saved_trips" ON public.saved_trips FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on saved_trips" ON public.saved_trips FOR DELETE USING (true);

CREATE POLICY "Allow public select on chat_history" ON public.chat_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert on chat_history" ON public.chat_history FOR INSERT WITH CHECK (true);
