require('dotenv').config();
const { Resend } = require('resend');

async function testSafeEmailDelivery() {
  const apiKey = process.env.RESEND_API_KEY;
  const verifiedEmail = 'd2025.adhyatmika.ghodvinde@ves.ac.in';
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!apiKey || apiKey === 're_your_actual_api_key') {
    console.error('ERROR: Add your actual RESEND_API_KEY to backend/.env.');
    process.exitCode = 1;
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verifiedEmail)) {
    console.error('ERROR: Enter a valid recipient email address.');
    process.exitCode = 1;
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    console.error('ERROR: RESEND_FROM_EMAIL must be a valid email address.');
    process.exitCode = 1;
    return;
  }

  const resend = new Resend(apiKey);

  console.log(`Sending test email to ${verifiedEmail}...`);
  console.log(`Sender: ${fromEmail}`);

  try {
    const { data, error } = await resend.emails.send({
      from: `AeroMate Test <${fromEmail}>`,
      to: [verifiedEmail],
      subject: 'AeroMate: Email Configuration Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2>AeroMate Email Test</h2>
          <p>Your AeroMate email configuration test was submitted to Resend.</p>
          <div style="background: #d1fae5; padding: 16px; border-radius: 8px; color: #065f46;">
            <strong>Status:</strong> Email accepted for processing
          </div>
          <p>If the email arrives, your basic email-sending setup is working.</p>
          <p>Thank you for testing AeroMate!</p>
        </div>
      `,
    });

    if (error) {
      console.error('FAILED: Resend returned an error.');
      console.error(error);
      process.exitCode = 1;
      return;
    }

    console.log('SUCCESS: Resend accepted the email request.');
    console.log('Email ID:', data?.id || 'Not provided');
    console.log('Check your inbox and spam folder.');
  } catch (err) {
    console.error('ERROR: Could not send the test email.');
    console.error(err.message);
    process.exitCode = 1;
  }
}

testSafeEmailDelivery();