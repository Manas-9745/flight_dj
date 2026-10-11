const { supabase, isConfigured } = require('../config/supabase');

class NotificationService {
  async getPreferences(userId) {
    if (!isConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.from('notification_preferences').select('*').eq('user_id', userId).single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data || null;
  }

  async updatePreferences(userId, updates) {
    if (!isConfigured) throw new Error('Supabase is not configured.');
    // Upsert equivalent using standard check or ON CONFLICT
    const existing = await this.getPreferences(userId);
    let result;
    if (existing) {
      result = await supabase
        .from('notification_preferences')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      result = await supabase
        .from('notification_preferences')
        .insert([{ user_id: userId, ...updates }])
        .select()
        .single();
    }
    if (result.error) throw new Error(result.error.message);
    return result.data;
  }

  async getHistory(userId) {
    if (!isConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.from('notification_history').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getSubscribedUsers() {
    if (!isConfigured) return [];
    // Get all users who have not opted out
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('user_id, email_settings');
      
    if (error) {
      console.error('⚠️ [NotificationService] Failed to fetch subscribed users:', error);
      return [];
    }
    // Filter by JSON field
    return data
      .filter(d => !d.email_settings || d.email_settings.transactional !== false)
      .map(d => d.user_id);
  }
}

module.exports = new NotificationService();
