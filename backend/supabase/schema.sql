-- ==============================================================================
-- AeroMate (PS-01) — Supabase PostgreSQL Schema & RLS Security Policies
-- ==============================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. SAVED TRIPS TABLE
CREATE TABLE IF NOT EXISTS public.saved_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flight_number VARCHAR(16) NOT NULL,
    airline VARCHAR(100),
    origin VARCHAR(8) NOT NULL,
    destination VARCHAR(8) NOT NULL,
    travel_date DATE NOT NULL,
    status VARCHAR(32) DEFAULT 'scheduled',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CHAT HISTORY TABLE (Optional persistent storage for AI conversations)
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    flight_number VARCHAR(16),
    role VARCHAR(16) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. PASSENGERS TABLE
CREATE TABLE IF NOT EXISTS public.passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    passenger_name TEXT NOT NULL,
    travel_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_booking_reference TEXT NOT NULL,
    booking_status VARCHAR(32) DEFAULT 'pending',
    itinerary JSONB DEFAULT '{}'::jsonb,
    passenger_relationship JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email_settings JSONB DEFAULT '{"promotional": false, "transactional": true}'::jsonb,
    news_preferences JSONB DEFAULT '[]'::jsonb,
    frequency VARCHAR(32) DEFAULT 'daily',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. NOTIFICATION HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(64) NOT NULL,
    related_trip_or_booking UUID,
    delivery_status VARCHAR(32) DEFAULT 'sent',
    deduplication_reference TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- AUTOMATIC POLICY CLEANUP (Drop ALL existing policies on these tables)
-- ==============================================================================
DO $$ 
DECLARE
    t_name text;
    pol RECORD;
BEGIN
    FOR t_name IN VALUES ('profiles'), ('saved_trips'), ('chat_history'), ('passengers'), ('bookings'), ('notification_preferences'), ('notification_history') LOOP
        FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t_name LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t_name);
        END LOOP;
    END LOOP;
END $$;

-- PROFILES POLICIES
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- SAVED TRIPS POLICIES
CREATE POLICY "Users can view their own trips"
    ON public.saved_trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own trips"
    ON public.saved_trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trips"
    ON public.saved_trips FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own trips"
    ON public.saved_trips FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CHAT HISTORY POLICIES
CREATE POLICY "Users can view their own chat history"
    ON public.chat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chat messages"
    ON public.chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PASSENGERS POLICIES
CREATE POLICY "Users can view their own passengers"
    ON public.passengers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own passengers"
    ON public.passengers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own passengers"
    ON public.passengers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own passengers"
    ON public.passengers FOR DELETE USING (auth.uid() = user_id);

-- BOOKINGS POLICIES
CREATE POLICY "Users can view their own bookings"
    ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bookings"
    ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookings"
    ON public.bookings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bookings"
    ON public.bookings FOR DELETE USING (auth.uid() = user_id);

-- NOTIFICATION PREFERENCES POLICIES
CREATE POLICY "Users can view their own notification preferences"
    ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notification preferences"
    ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notification preferences"
    ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- NOTIFICATION HISTORY POLICIES
CREATE POLICY "Users can view their own notification history"
    ON public.notification_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notification history"
    ON public.notification_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, preferred_language)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        COALESCE(new.raw_user_meta_data->>'preferred_language', 'en')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for optimal lookup performance
CREATE INDEX IF NOT EXISTS idx_saved_trips_user_id ON public.saved_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_trips_flight_number ON public.saved_trips(flight_number);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_flight ON public.chat_history(user_id, flight_number);
