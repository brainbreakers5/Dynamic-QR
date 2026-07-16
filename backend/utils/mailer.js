const nodemailer = require('nodemailer');

async function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }

  // Fallback: Ethereal Email for development/testing
  console.log('No SMTP config found in .env. Creating Ethereal test SMTP account...');
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
}

async function sendPasswordResetEmail(email, code) {
  try {
    const transporter = await getTransporter();
    const from = process.env.SMTP_FROM || '"dynamicQR Support" <support@dynamicqr.com>';

    const info = await transporter.sendMail({
      from,
      to: email,
      subject: 'Password Verification Code - dynamicQR',
      text: `Your password verification code is: ${code}. This code will expire in 15 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #7c4dff;">dynamicQR</h2>
          <p>You requested a password reset. Use the following 6-digit verification code to reset your password:</p>
          <div style="font-size: 24px; font-weight: bold; background-color: #f5f4fb; padding: 12px; border-radius: 4px; text-align: center; color: #6200ea; letter-spacing: 4px; margin: 20px 0;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #6f6a85;">This code will expire in 15 minutes. If you did not request this reset, please ignore this email.</p>
        </div>
      `
    });

    console.log(`Password reset email sent to ${email}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('----------------------------------------------------');
      console.log(`✉️ Ethereal Email Preview URL: ${previewUrl}`);
      console.log('----------------------------------------------------');
    }
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

module.exports = { sendPasswordResetEmail };
