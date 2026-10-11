const { Resend } = require('resend');

class EmailService {
  constructor() {
    this.resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@aeromate.com';
  }

  async sendEmail({ to, subject, html }) {
    if (!this.resend) {
      console.warn('⚠️ [EmailService] Resend API Key is missing. Email not sent to:', to);
      return { success: false, error: 'Resend API Key not configured' };
    }

    try {
      const data = await this.resend.emails.send({
        from: `AeroMate <${this.fromEmail}>`,
        to,
        subject,
        html
      });
      return { success: true, data };
    } catch (error) {
      console.error('❌ [EmailService] Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendBookingConfirmation(toEmail, bookingDetails) {
    const { flight_id, confirmation_code, passenger_name, status } = bookingDetails;
    
    // Safety check - only send if booking is confirmed
    if (status !== 'confirmed') {
      console.log(`[EmailService] Skipping confirmation for unconfirmed booking: ${confirmation_code}`);
      return { success: false, error: 'Booking not confirmed' };
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #2563eb;">Booking Confirmed! ✈️</h2>
        <p>Hi ${passenger_name || 'Traveler'},</p>
        <p>Your flight booking has been officially confirmed.</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Confirmation Code:</strong> ${confirmation_code}</p>
          <p><strong>Flight:</strong> ${flight_id}</p>
          <p><strong>Status:</strong> ${status.toUpperCase()}</p>
        </div>
        <p>Thank you for choosing AeroMate. Safe travels!</p>
      </div>
    `;

    return this.sendEmail({
      to: toEmail,
      subject: `AeroMate: Booking Confirmed - ${confirmation_code}`,
      html
    });
  }

  async sendFlightDisruptionAlert(toEmail, flightDetails) {
    const { flight_iata, old_status, new_status, delay_minutes } = flightDetails;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #dc2626;">Flight Update Alert ⚠️</h2>
        <p>We've detected a meaningful status change for your tracked flight <strong>${flight_iata}</strong>.</p>
        <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Previous Status:</strong> ${old_status || 'Unknown'}</p>
          <p><strong>New Status:</strong> ${new_status}</p>
          ${delay_minutes ? `<p><strong>Estimated Delay:</strong> ${delay_minutes} minutes</p>` : ''}
        </div>
        <p>Please check the AeroMate dashboard for the latest AI disruption guidance.</p>
      </div>
    `;

    return this.sendEmail({
      to: toEmail,
      subject: `Flight Update: ${flight_iata} is now ${new_status}`,
      html
    });
  }

  async sendBaggageAlert(toEmail, baggageAlert) {
    const {
      tag_number,
      passenger_name,
      flight_number,
      status,
      previous_status,
      location,
      details,
      is_simulated
    } = baggageAlert;

    const statusBadgeColor = (status === 'Delayed' || status === 'Misrouted' || status === 'Reported Missing')
      ? '#dc2626'
      : (status === 'Ready for Collection' || status === 'Delivered to Passenger' || status === 'Located')
      ? '#059669'
      : '#2563eb';

    const modeNotice = is_simulated
      ? '<p style="font-size: 11px; color: #6b7280; font-style: italic; margin-top: 4px;">[Notice: This status update was simulated in AeroMate Demo Mode]</p>'
      : '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: ${statusBadgeColor}; margin-top: 0;">🧳 Baggage Status Update</h2>
        <p>Dear ${passenger_name || 'Passenger'},</p>
        <p>There is a meaningful update regarding your checked baggage for flight <strong>${flight_number || 'your flight'}</strong>.</p>
        
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusBadgeColor};">
          <p style="margin: 4px 0;"><strong>Baggage Tag:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${tag_number}</code></p>
          <p style="margin: 4px 0;"><strong>Current Status:</strong> <span style="font-weight: bold; color: ${statusBadgeColor};">${status}</span></p>
          ${previous_status ? `<p style="margin: 4px 0;"><strong>Previous Status:</strong> ${previous_status}</p>` : ''}
          ${location ? `<p style="margin: 4px 0;"><strong>Location:</strong> ${location}</p>` : ''}
          ${details ? `<p style="margin: 4px 0;"><strong>Details:</strong> ${details}</p>` : ''}
          ${modeNotice}
        </div>

        <p>You can track the complete journey timeline or file a Property Irregularity Report (PIR) directly in your AeroMate dashboard.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280;">AeroMate Automated Flight & Baggage Assistance System</p>
      </div>
    `;

    return this.sendEmail({
      to: toEmail,
      subject: `AeroMate Baggage Alert: Tag ${tag_number} is now ${status}`,
      html
    });
  }
}

module.exports = new EmailService();
