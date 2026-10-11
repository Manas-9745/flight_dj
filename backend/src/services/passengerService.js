const { supabase, isConfigured } = require('../config/supabase');

class PassengerService {
  async getPassengers(userId) {
    if (!isConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.from('passengers').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async addPassenger(userId, passengerData) {
    if (!isConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('passengers')
      .insert([{ user_id: userId, ...passengerData }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updatePassenger(userId, id, updates) {
    if (!isConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('passengers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deletePassenger(userId, id) {
    if (!isConfigured) throw new Error('Supabase is not configured.');
    const { error } = await supabase.from('passengers').delete().eq('id', id).eq('user_id', userId);
    if (error) throw new Error(error.message);
    return { success: true };
  }
}

module.exports = new PassengerService();
