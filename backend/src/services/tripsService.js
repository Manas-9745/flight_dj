const crypto = require('crypto');
const { supabase, supabaseAdmin, isConfigured } = require('../config/supabase');

// Deterministic UUID mapper for non-UUID user IDs (e.g., usr_... or local IDs)
function toValidUuid(id) {
  if (!id) return '00000000-0000-4000-a000-000000000001';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;
  const h = crypto.createHash('md5').update(String(id).toLowerCase().trim()).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

// In-memory store for local fallback
const inMemoryTrips = new Map();

class TripsService {
  async getUserTrips(userId) {
    const dbUserId = toValidUuid(userId);
    const client = supabaseAdmin || supabase;

    if (isConfigured && client) {
      try {
        const { data, error } = await client
          .from('saved_trips')
          .select('*')
          .eq('user_id', dbUserId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          // Merge with any session memory items
          const mem = inMemoryTrips.get(userId) || [];
          const existingIds = new Set(data.map(d => d.id));
          return [...data, ...mem.filter(m => !existingIds.has(m.id))];
        }
        if (error) {
          console.warn('Supabase fetch trips notice:', error.message);
        }
      } catch (err) {
        console.warn('Supabase fetch trips exception, falling back:', err.message);
      }
    }

    // In-memory fallback
    return inMemoryTrips.get(userId) || [];
  }

  async saveTrip(userId, tripData) {
    const { flightNumber, airline, origin, destination, travelDate, status, metadata } = tripData;

    if (!flightNumber || !origin || !destination) {
      throw new Error('Flight number, origin, and destination are required.');
    }

    const dbUserId = toValidUuid(userId);
    const client = supabaseAdmin || supabase;

    const payload = {
      flight_number: flightNumber.toUpperCase(),
      airline: airline || 'Airlines',
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      travel_date: travelDate || new Date().toISOString().split('T')[0],
      status: status || 'scheduled',
      metadata: metadata || {}
    };

    if (isConfigured && client) {
      try {
        const { data, error } = await client
          .from('saved_trips')
          .insert([{ ...payload, user_id: dbUserId }])
          .select()
          .single();

        if (!error && data) {
          return data;
        }
        if (error) {
          console.warn('Supabase saveTrip notice, saving to memory fallback:', error.message);
        }
      } catch (err) {
        console.warn('Supabase saveTrip exception, saving to memory fallback:', err.message);
      }
    }

    // Fallback in-memory
    const newTrip = {
      id: `trip-${Date.now()}`,
      user_id: userId,
      ...payload,
      created_at: new Date().toISOString()
    };

    const userList = inMemoryTrips.get(userId) || [];
    userList.unshift(newTrip);
    inMemoryTrips.set(userId, userList);
    return newTrip;
  }

  async deleteTrip(userId, tripId) {
    const dbUserId = toValidUuid(userId);
    const client = supabaseAdmin || supabase;

    if (isConfigured && client) {
      try {
        await client
          .from('saved_trips')
          .delete()
          .eq('id', tripId)
          .eq('user_id', dbUserId);
      } catch (err) {
        console.warn('Supabase deleteTrip notice:', err.message);
      }
    }

    const userList = inMemoryTrips.get(userId) || [];
    inMemoryTrips.set(userId, userList.filter(t => t.id !== tripId));
    return { success: true, id: tripId };
  }

  async updateTrip(userId, tripId, updateData) {
    const dbUserId = toValidUuid(userId);
    const client = supabaseAdmin || supabase;

    if (isConfigured && client) {
      try {
        const { data, error } = await client
          .from('saved_trips')
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', tripId)
          .eq('user_id', dbUserId)
          .select()
          .single();

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase updateTrip notice:', err.message);
      }
    }

    let userList = inMemoryTrips.get(userId) || [];
    const tripIndex = userList.findIndex(t => t.id === tripId);
    if (tripIndex >= 0) {
      const updated = {
        ...userList[tripIndex],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      userList[tripIndex] = updated;
      inMemoryTrips.set(userId, userList);
      return updated;
    }
    return { id: tripId, user_id: userId, ...updateData };
  }
}

module.exports = new TripsService();
