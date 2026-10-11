const { supabase, supabaseAdmin, isConfigured } = require('../config/supabase');
const emailService = require('./emailService');
const profileService = require('./profileService');

// Valid baggage journey stages (Requirement 3)
const VALID_STATUSES = [
  'Registered',
  'Checked In',
  'Loaded onto Aircraft',
  'In Transit',
  'Arrived at Destination',
  'Ready for Collection',
  'Delayed',
  'Misrouted',
  'Reported Missing',
  'Located',
  'Delivered to Passenger'
];

// Meaningful alerts that trigger notification service & Resend email (Requirement 6)
const ALERT_TRIGGER_STATUSES = [
  'Delayed',
  'Misrouted',
  'Reported Missing',
  'Located',
  'Ready for Collection',
  'Delivered to Passenger'
];

// In-memory fallback per user if Supabase table is not yet migrated in PostgreSQL
const inMemoryBaggage = new Map(); // userId -> Array of baggage records
const inMemoryHistory = new Map(); // baggageId -> Array of status history records

class BaggageService {
  constructor() {
    this.validStatuses = VALID_STATUSES;
    this.alertStatuses = ALERT_TRIGGER_STATUSES;
  }

  /**
   * Verify booking reference against authenticated user's confirmed bookings
   * Requirement 4: "Never trust a user-provided booking reference alone as proof of booking ownership.
   * Verify it against the authenticated user's booking whenever possible."
   */
  async verifyUserBooking(userId, bookingReference, flightNumber) {
    if (!bookingReference) return { verified: false, bookingId: null };

    const cleanRef = String(bookingReference).trim().toUpperCase();

    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from('bookings')
          .select('id, provider_booking_reference, itinerary, booking_status')
          .eq('user_id', userId);

        if (!error && Array.isArray(data)) {
          const match = data.find(b => {
            const refMatch = b.provider_booking_reference && b.provider_booking_reference.toUpperCase() === cleanRef;
            if (!refMatch) return false;
            // Optionally check flight number if itinerary provided
            if (flightNumber && b.itinerary?.flightNumber) {
              return b.itinerary.flightNumber.toUpperCase() === String(flightNumber).toUpperCase().trim();
            }
            return true;
          });

          if (match) {
            return {
              verified: true,
              bookingId: match.id,
              bookingDetails: match
            };
          }
        }
      } catch (err) {
        console.warn('⚠️ [BaggageService] Error checking user booking:', err.message);
      }
    }

    return { verified: false, bookingId: null };
  }

  /**
   * List all registered bags for the authenticated user
   */
  async getUserBaggage(userId) {
    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from('baggage_records')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data;
        }
      } catch (err) {
        console.warn('⚠️ [BaggageService] Supabase query failed, using in-memory store:', err.message);
      }
    }

    const userBags = inMemoryBaggage.get(userId) || [];
    return [...userBags];
  }

  /**
   * Get single baggage record by ID with authorization check
   */
  async getBaggageById(userId, baggageId) {
    let bag = null;

    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from('baggage_records')
          .select('*')
          .eq('id', baggageId)
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          bag = data;
        }
      } catch (err) {
        console.warn('⚠️ [BaggageService] Supabase getBaggageById failed:', err.message);
      }
    }

    if (!bag) {
      const userBags = inMemoryBaggage.get(userId) || [];
      bag = userBags.find(b => b.id === baggageId);
    }

    if (!bag) {
      throw new Error('Baggage record not found or unauthorized access.');
    }

    // Attach status history
    const history = await this.getBaggageHistory(userId, baggageId);
    return {
      ...bag,
      history
    };
  }

  /**
   * Get chronological status history for a bag
   */
  async getBaggageHistory(userId, baggageId) {
    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from('baggage_status_history')
          .select('*')
          .eq('baggage_id', baggageId)
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (!error && Array.isArray(data)) {
          return data;
        }
      } catch (err) {
        console.warn('⚠️ [BaggageService] Supabase history query failed:', err.message);
      }
    }

    const hist = inMemoryHistory.get(baggageId) || [];
    return [...hist];
  }

  /**
   * Register a new checked bag
   */
  async registerBaggage(userId, data) {
    const {
      passenger_name,
      booking_reference,
      flight_number,
      origin,
      destination,
      tag_number,
      description,
      photo_url
    } = data;

    // Server-side validation
    if (!passenger_name || !passenger_name.trim()) {
      throw new Error('Passenger name is required.');
    }
    if (!flight_number || !flight_number.trim()) {
      throw new Error('Flight number is required.');
    }
    if (!origin || !origin.trim() || !destination || !destination.trim()) {
      throw new Error('Departure and arrival airport IATA codes are required.');
    }
    if (!tag_number || !tag_number.trim()) {
      throw new Error('Baggage tag number is required.');
    }

    const cleanOrigin = origin.trim().toUpperCase();
    const cleanDestination = destination.trim().toUpperCase();
    const cleanFlight = flight_number.trim().toUpperCase();
    const cleanTag = tag_number.trim().toUpperCase();
    const cleanPassenger = passenger_name.trim();

    // Verify booking reference
    const { verified, bookingId } = await this.verifyUserBooking(userId, booking_reference, cleanFlight);

    const initialStatus = 'Registered';
    const initialLocation = `${cleanOrigin} Airport - Check-in Counter`;
    const nowIso = new Date().toISOString();

    const recordPayload = {
      id: `bag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      booking_id: bookingId || null,
      booking_reference: booking_reference ? booking_reference.trim().toUpperCase() : null,
      passenger_name: cleanPassenger,
      flight_number: cleanFlight,
      origin: cleanOrigin,
      destination: cleanDestination,
      tag_number: cleanTag,
      description: description ? description.trim() : null,
      photo_url: photo_url || null,
      status: initialStatus,
      last_known_location: initialLocation,
      last_updated_at: nowIso,
      is_simulated: true, // Clearly labelled Demo Mode unless airline integration is confirmed
      is_verified_booking: verified,
      pir_reference: null,
      recovery_status: null,
      recovery_notes: null,
      metadata: {
        created_via: 'web_portal',
        demo_mode: true
      },
      created_at: nowIso
    };

    let savedRecord = null;

    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabase;
        const { data: dbData, error } = await client
          .from('baggage_records')
          .insert([recordPayload])
          .select()
          .single();

        if (!error && dbData) {
          savedRecord = dbData;
        }
      } catch (err) {
        console.warn('⚠️ [BaggageService] Supabase insert failed, using memory:', err.message);
      }
    }

    if (!savedRecord) {
      savedRecord = recordPayload;
      const userBags = inMemoryBaggage.get(userId) || [];
      userBags.unshift(savedRecord);
      inMemoryBaggage.set(userId, userBags);
    }

    // Add initial history event
    await this.addStatusHistoryEntry(userId, savedRecord.id, {
      status: initialStatus,
      location: initialLocation,
      update_source: 'passenger_registration',
      notes: `Bag registered with tag ${cleanTag} on flight ${cleanFlight}.`,
      is_simulated: true
    });

    return savedRecord;
  }

  /**
   * Internal helper: Add status history entry
   */
  async addStatusHistoryEntry(userId, baggageId, entry) {
    const historyPayload = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      baggage_id: baggageId,
      user_id: userId,
      status: entry.status,
      location: entry.location || null,
      update_source: entry.update_source || 'user_manual',
      notes: entry.notes || null,
      is_simulated: entry.is_simulated !== false,
      created_at: new Date().toISOString()
    };

    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabase;
        await client.from('baggage_status_history').insert([historyPayload]);
      } catch (err) {
        console.warn('⚠️ [BaggageService] Supabase history insert failed:', err.message);
      }
    }

    const hist = inMemoryHistory.get(baggageId) || [];
    hist.push(historyPayload);
    inMemoryHistory.set(baggageId, hist);

    return historyPayload;
  }

  /**
   * Update baggage status (Authorized update or Demo simulation step)
   */
  async updateStatus(userId, baggageId, { status, location, notes, update_source = 'user_manual', is_simulated = true }) {
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid status: ${status}. Valid values: ${VALID_STATUSES.join(', ')}`);
    }

    const currentBag = await this.getBaggageById(userId, baggageId);
    const previousStatus = currentBag.status;
    const nowIso = new Date().toISOString();

    const updates = {
      status,
      last_known_location: location || currentBag.last_known_location,
      last_updated_at: nowIso,
      is_simulated: !!is_simulated
    };

    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabase;
        const { data: dbData, error } = await client
          .from('baggage_records')
          .update(updates)
          .eq('id', baggageId)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && dbData) {
          // record updated
        }
      } catch (err) {
        console.warn('⚠️ [BaggageService] Supabase update status failed:', err.message);
      }
    }

    // Update in-memory copy
    const userBags = inMemoryBaggage.get(userId) || [];
    const idx = userBags.findIndex(b => b.id === baggageId);
    if (idx !== -1) {
      userBags[idx] = { ...userBags[idx], ...updates };
      inMemoryBaggage.set(userId, userBags);
    }

    // Record in history
    await this.addStatusHistoryEntry(userId, baggageId, {
      status,
      location: updates.last_known_location,
      update_source,
      notes: notes || `Status changed from ${previousStatus} to ${status}.`,
      is_simulated
    });

    // Send baggage alert if meaningful status change
    if (this.alertStatuses.includes(status) && status !== previousStatus) {
      this.triggerBaggageAlert(userId, {
        ...currentBag,
        status,
        previous_status: previousStatus,
        location: updates.last_known_location,
        details: notes,
        is_simulated
      }).catch(err => {
        console.warn('⚠️ [BaggageService] Failed to trigger baggage alert:', err.message);
      });
    }

    return this.getBaggageById(userId, baggageId);
  }

  /**
   * Submit baggage recovery report (delayed, misrouted, or missing)
   */
  async submitRecoveryReport(userId, baggageId, reportData) {
    const { issue_type, pir_reference, recovery_notes, last_seen_location } = reportData;

    const bag = await this.getBaggageById(userId, baggageId);
    const nowIso = new Date().toISOString();

    let newStatus = bag.status;
    if (issue_type === 'missing') newStatus = 'Reported Missing';
    else if (issue_type === 'delayed') newStatus = 'Delayed';
    else if (issue_type === 'misrouted') newStatus = 'Misrouted';

    const updates = {
      status: newStatus,
      pir_reference: pir_reference ? pir_reference.trim().toUpperCase() : bag.pir_reference,
      recovery_status: 'Report Submitted',
      recovery_notes: recovery_notes ? recovery_notes.trim() : null,
      last_known_location: last_seen_location || bag.last_known_location,
      last_updated_at: nowIso,
      is_simulated: true // User manual report
    };

    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabase;
        await client
          .from('baggage_records')
          .update(updates)
          .eq('id', baggageId)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('⚠️ [BaggageService] Supabase recovery update error:', err.message);
      }
    }

    // Update in-memory
    const userBags = inMemoryBaggage.get(userId) || [];
    const idx = userBags.findIndex(b => b.id === baggageId);
    if (idx !== -1) {
      userBags[idx] = { ...userBags[idx], ...updates };
      inMemoryBaggage.set(userId, userBags);
    }

    await this.addStatusHistoryEntry(userId, baggageId, {
      status: newStatus,
      location: updates.last_known_location,
      update_source: 'user_recovery_report',
      notes: `Passenger filed recovery report (${issue_type}). PIR Reference: ${updates.pir_reference || 'Pending'}. Note: ${recovery_notes || 'None'}`,
      is_simulated: true
    });

    // Trigger notification
    this.triggerBaggageAlert(userId, {
      ...bag,
      status: newStatus,
      previous_status: bag.status,
      location: updates.last_known_location,
      details: `Recovery report submitted. Claim PIR: ${updates.pir_reference || 'N/A'}.`,
      is_simulated: true
    }).catch(err => {
      console.warn('⚠️ [BaggageService] Alert error:', err.message);
    });

    return this.getBaggageById(userId, baggageId);
  }

  /**
   * Update Property Irregularity Report (PIR) reference and recovery status
   */
  async updateRecoveryStatus(userId, baggageId, { recovery_status, pir_reference, notes }) {
    const validRecoveryStatuses = [
      'Report Submitted',
      'Airline Contacted',
      'Baggage Located',
      'Delivery Scheduled',
      'Case Resolved'
    ];

    if (!validRecoveryStatuses.includes(recovery_status)) {
      throw new Error(`Invalid recovery status. Allowed: ${validRecoveryStatuses.join(', ')}`);
    }

    const bag = await this.getBaggageById(userId, baggageId);
    const nowIso = new Date().toISOString();

    const updates = {
      recovery_status,
      pir_reference: pir_reference ? pir_reference.trim().toUpperCase() : bag.pir_reference,
      recovery_notes: notes || bag.recovery_notes,
      last_updated_at: nowIso
    };

    if (recovery_status === 'Baggage Located' && bag.status !== 'Located') {
      updates.status = 'Located';
    } else if (recovery_status === 'Case Resolved') {
      updates.status = 'Delivered to Passenger';
    }

    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabase;
        await client
          .from('baggage_records')
          .update(updates)
          .eq('id', baggageId)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('⚠️ [BaggageService] Supabase recovery status update error:', err.message);
      }
    }

    const userBags = inMemoryBaggage.get(userId) || [];
    const idx = userBags.findIndex(b => b.id === baggageId);
    if (idx !== -1) {
      userBags[idx] = { ...userBags[idx], ...updates };
      inMemoryBaggage.set(userId, userBags);
    }

    await this.addStatusHistoryEntry(userId, baggageId, {
      status: updates.status || bag.status,
      location: bag.last_known_location,
      update_source: 'airline_assistance_update',
      notes: `Recovery status updated to: ${recovery_status}. PIR: ${updates.pir_reference || 'N/A'}.`,
      is_simulated: true
    });

    if (updates.status && updates.status !== bag.status) {
      this.triggerBaggageAlert(userId, {
        ...bag,
        status: updates.status,
        previous_status: bag.status,
        details: `Recovery step completed: ${recovery_status}`,
        is_simulated: true
      }).catch(() => {});
    }

    return this.getBaggageById(userId, baggageId);
  }

  /**
   * Delete baggage record
   */
  async deleteBaggage(userId, baggageId) {
    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabase;
        await client
          .from('baggage_records')
          .delete()
          .eq('id', baggageId)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('⚠️ [BaggageService] Supabase delete error:', err.message);
      }
    }

    const userBags = inMemoryBaggage.get(userId) || [];
    const filtered = userBags.filter(b => b.id !== baggageId);
    inMemoryBaggage.set(userId, filtered);
    inMemoryHistory.delete(baggageId);

    return { success: true, id: baggageId };
  }

  /**
   * Demo Simulation: Advance baggage to next journey status
   */
  async simulateNextStep(userId, baggageId) {
    const bag = await this.getBaggageById(userId, baggageId);
    const order = [
      { status: 'Registered', loc: `${bag.origin} Airport - Check-in Counter` },
      { status: 'Checked In', loc: `${bag.origin} Airport - Baggage Drop Conveyor Belt` },
      { status: 'Loaded onto Aircraft', loc: `${bag.origin} Airport - Aircraft Ramp & Cargo Hold (Flight ${bag.flight_number})` },
      { status: 'In Transit', loc: `Cruising Airspace - Flight ${bag.flight_number}` },
      { status: 'Arrived at Destination', loc: `${bag.destination} Airport - Ramp Offloading` },
      { status: 'Ready for Collection', loc: `${bag.destination} Airport - Baggage Carousel #3` },
      { status: 'Delivered to Passenger', loc: `${bag.destination} Airport - Passenger Reclaim Confirmed` }
    ];

    const curIndex = order.findIndex(o => o.status === bag.status);
    let nextStep = order[0];
    if (curIndex !== -1 && curIndex < order.length - 1) {
      nextStep = order[curIndex + 1];
    } else if (curIndex === -1) {
      nextStep = order[1];
    }

    return this.updateStatus(userId, baggageId, {
      status: nextStep.status,
      location: nextStep.loc,
      notes: `[DEMO SIMULATION]: Automatic handling simulation progressed to '${nextStep.status}'.`,
      update_source: 'demo_simulation_engine',
      is_simulated: true
    });
  }

  /**
   * Trigger email alert via existing Resend email service and notification preferences
   */
  async triggerBaggageAlert(userId, alertData) {
    // 1. Check user notification preferences
    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabase;
        const { data: prefs } = await client
          .from('notification_preferences')
          .select('email_settings')
          .eq('user_id', userId)
          .single();

        if (prefs?.email_settings && prefs.email_settings.transactional === false) {
          console.log(`[BaggageService] User ${userId} unsubscribed from transactional alerts.`);
          return;
        }
      } catch (err) {
        // Continue if prefs check fails
      }
    }

    // 2. Prevent duplicate notifications via deduplication reference
    const dedupRef = `bag_${alertData.id}_${alertData.status}_${Math.floor(Date.now() / 60000)}`;
    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabase;
        const { error: lockErr } = await client
          .from('notification_history')
          .insert([{
            user_id: userId,
            notification_type: 'baggage_alert',
            delivery_status: 'pending',
            deduplication_reference: dedupRef
          }]);

        if (lockErr) {
          console.log(`[BaggageService] Deduplication lock exists for ${dedupRef}`);
          return;
        }
      } catch (err) {
        // proceed
      }
    }

    // 3. Resolve user email
    let recipientEmail = null;
    try {
      const profile = await profileService.getProfile(userId);
      recipientEmail = profile?.email;
    } catch {
      // ignore
    }

    if (!recipientEmail) {
      console.log(`[BaggageService] No email address for user ${userId}; skipped email.`);
      return;
    }

    // 4. Send email via Resend
    const sendRes = await emailService.sendBaggageAlert(recipientEmail, alertData);

    // 5. Update history status if configured
    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabase;
        await client
          .from('notification_history')
          .update({ delivery_status: sendRes.success ? 'sent' : 'failed' })
          .eq('deduplication_reference', dedupRef);
      } catch {
        // ignore
      }
    }

    return sendRes;
  }
}

module.exports = new BaggageService();
