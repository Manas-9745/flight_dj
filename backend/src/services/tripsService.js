const { supabase, isConfigured } = require('../config/supabase');

// In-memory store for local testing if Supabase is offline
const inMemoryTrips = new Map();

class TripsService {
  async getUserTrips(userId) {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('saved_trips')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error fetching trips:', error.message);
        throw new Error(error.message);
      }
      return data || [];
    }

    // Mock fallback
    let userList = inMemoryTrips.get(userId);
    if (!userList || userList.length === 0) {
      userList = [
        {
          id: 'mock-trip-1',
          user_id: userId,
          flight_number: 'BA142',
          airline: 'British Airways',
          origin: 'LHR',
          destination: 'JFK',
          travel_date: '2026-10-15',
          status: 'delayed',
          metadata: { terminal: '5', gate: 'B36' },
          created_at: new Date().toISOString()
        }
      ];
      inMemoryTrips.set(userId, userList);
    }
    return userList;
  }

  async saveTrip(userId, tripData) {
    const { flightNumber, airline, origin, destination, travelDate, status, metadata } = tripData;

    if (!flightNumber || !origin || !destination) {
      throw new Error('Flight number, origin, and destination are required.');
    }

    if (isConfigured) {
      const { data, error } = await supabase
        .from('saved_trips')
        .insert([
          {
            user_id: userId,
            flight_number: flightNumber.toUpperCase(),
            airline: airline || 'Airlines',
            origin: origin.toUpperCase(),
            destination: destination.toUpperCase(),
            travel_date: travelDate || new Date().toISOString().split('T')[0],
            status: status || 'scheduled',
            metadata: metadata || {}
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error saving trip:', error.message);
        throw new Error(error.message);
      }
      return data;
    }

    // Fallback store
    const newTrip = {
      id: `trip-${Date.now()}`,
      user_id: userId,
      flight_number: flightNumber.toUpperCase(),
      airline: airline || 'Airlines',
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      travel_date: travelDate || new Date().toISOString().split('T')[0],
      status: status || 'scheduled',
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };

    const userList = inMemoryTrips.get(userId) || [];
    userList.unshift(newTrip);
    inMemoryTrips.set(userId, userList);
    return newTrip;
  }

  async deleteTrip(userId, tripId) {
    if (isConfigured) {
      const { error } = await supabase
        .from('saved_trips')
        .delete()
        .eq('id', tripId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Supabase error deleting trip:', error.message);
        throw new Error(error.message);
      }
      return { success: true, id: tripId };
    }

    const userList = inMemoryTrips.get(userId) || [];
    const filtered = userList.filter(t => t.id !== tripId);
    inMemoryTrips.set(userId, filtered);
    return { success: true, id: tripId };
  }

  async updateTrip(userId, tripId, updateData) {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('saved_trips')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', tripId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error updating trip:', error.message);
        throw new Error(error.message);
      }
      return data;
    }

    let userList = inMemoryTrips.get(userId);
    if (!userList || userList.length === 0) {
      userList = await this.getUserTrips(userId);
    }
    const tripIndex = userList.findIndex(t => t.id === tripId);
    if (tripIndex === -1) {
      const newMock = {
        id: tripId,
        user_id: userId,
        flight_number: updateData.flight_number || 'AI161',
        airline: updateData.airline || 'Air India',
        status: updateData.status || 'rebooked',
        ...updateData,
        updated_at: new Date().toISOString()
      };
      userList.unshift(newMock);
      inMemoryTrips.set(userId, userList);
      return newMock;
    }

    const updated = {
      ...userList[tripIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    };
    userList[tripIndex] = updated;
    inMemoryTrips.set(userId, userList);
    return updated;
  }
}

module.exports = new TripsService();
