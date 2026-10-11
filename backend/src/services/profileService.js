const { supabase, isConfigured } = require('../config/supabase');

class ProfileService {
  async getProfile(userId) {
    if (!isConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message); // PGRST116 = no rows returned
    return data;
  }

  async updateProfile(userId, updates) {
    if (!isConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}

module.exports = new ProfileService();
