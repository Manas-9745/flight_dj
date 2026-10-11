const { supabase, isConfigured } = require('../config/supabase');
const emailService = require('./emailService');
const profileService = require('./profileService');

class BookingService {
  async getBookings(userId) {
    if (!isConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.from('bookings').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async addBooking(userId, bookingData) {
    if (!isConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('bookings')
      .insert([{ user_id: userId, ...bookingData }])
      .select()
      .single();
    if (error) throw new Error(error.message);

    // If confirmed by provider, trigger confirmation email
    const isConfirmed = (data?.booking_status === 'confirmed' || data?.status === 'confirmed');
    const hasProviderRef = Boolean(data?.provider_booking_reference);

    if (data && isConfirmed && hasProviderRef) {
      try {
        await this.triggerBookingConfirmationEmail(userId, data);
      } catch (err) {
        console.error('⚠️ [BookingService] Error sending confirmation email:', err);
      }
    }

    return data;
  }

  async triggerBookingConfirmationEmail(userId, booking) {
    // 1. Check preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('email_settings')
      .eq('user_id', userId)
      .single();

    if (prefs?.email_settings && prefs.email_settings.transactional === false) {
      console.log(`[BookingService] User ${userId} has unsubscribed from transactional emails.`);
      return;
    }

    // 2. Atomic Deduplication Lock via unique deduplication_reference in notification_history
    const notifType = 'booking_confirmation';
    const dedupRef = `booking_${booking.id || booking.provider_booking_reference}`;

    // Insert pending lock record
    const { error: lockError } = await supabase.from('notification_history').insert([{
      user_id: userId,
      notification_type: notifType,
      related_trip_or_booking: booking.id,
      delivery_status: 'pending',
      deduplication_reference: dedupRef
    }]);

    // If lock fails (e.g. duplicate key error), someone else already triggered it
    if (lockError) {
      console.log(`[BookingService] Notification already processed or locked for: ${dedupRef}`);
      return;
    }

    // 3. Get user email
    const profile = await profileService.getProfile(userId);
    const recipientEmail = profile?.email || booking.passenger_email;

    if (!recipientEmail) {
      console.warn(`[BookingService] No email address found for user: ${userId}`);
      await supabase.from('notification_history').update({ delivery_status: 'failed' }).eq('deduplication_reference', dedupRef);
      return;
    }

    // 4. Send Email via Resend
    const result = await emailService.sendBookingConfirmation(recipientEmail, {
      ...booking,
      confirmation_code: booking.provider_booking_reference || booking.confirmation_code,
      status: 'confirmed'
    });

    // 5. Update history status
    await supabase.from('notification_history').update({
      delivery_status: result.success ? 'sent' : 'failed'
    }).eq('deduplication_reference', dedupRef);
  }

  async updateBooking(userId, id, updates) {
    if (!isConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('bookings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteBooking(userId, id) {
    if (!isConfigured) throw new Error('Supabase is not configured.');
    const { error } = await supabase.from('bookings').delete().eq('id', id).eq('user_id', userId);
    if (error) throw new Error(error.message);
    return { success: true };
  }
}

module.exports = new BookingService();
