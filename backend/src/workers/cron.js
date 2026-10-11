const cron = require('node-cron');
const disruptionManager = require('../services/disruptionManagerService');
const notificationService = require('../services/notificationService');
const profileService = require('../services/profileService');
const emailService = require('../services/emailService');
const { supabase } = require('../config/supabase');

class CronManager {
  start() {
    console.log('⏰ [Cron] Initializing scheduled tasks...');

    // Run every hour
    cron.schedule('0 * * * *', async () => {
      console.log('⏰ [Cron] Running flight disruption monitor task...');
      try {
        const userIds = await notificationService.getSubscribedUsers();
        
        for (const userId of userIds) {
          const profile = await profileService.getProfile(userId);
          if (!profile || !profile.email) continue;

          // Get disruptions for user
          const { trips } = await disruptionManager.monitorUserTrips(userId);
          const disruptedTrips = trips.filter(t => t.isDisrupted);

          for (const trip of disruptedTrips) {
            // Atomic Deduplication Lock via notification_history
            const dedupRef = `disruption_${trip.alertId}`;
            
            const { error: lockError } = await supabase.from('notification_history').insert([{
              user_id: userId,
              notification_type: 'flight_disruption',
              related_trip_or_booking: trip.tripId,
              delivery_status: 'pending',
              deduplication_reference: dedupRef
            }]);

            if (lockError) {
              continue; // Already locked or sent
            }

            // Send Email
            const result = await emailService.sendFlightDisruptionAlert(profile.email, {
              flight_iata: trip.flightNumber,
              old_status: 'scheduled',
              new_status: trip.status,
              delay_minutes: trip.delayMinutes
            });

            // Update history status
            await supabase.from('notification_history').update({
              delivery_status: result.success ? 'sent' : 'failed'
            }).eq('deduplication_reference', dedupRef);
          }
        }
      } catch (err) {
        console.error('❌ [Cron] Error running disruption monitor:', err);
      }
    });
  }
}

module.exports = new CronManager();
