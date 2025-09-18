import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@bedspace.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendOTPEmail = async (email: string, otp: string, name: string): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email - BedSpace</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background: #f9f9f9; }
        .otp-box { background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>BedSpace</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}!</h2>
          <p>Thank you for registering with BedSpace. Please use the following OTP to verify your email address:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p>This OTP will expire in 10 minutes. If you didn't request this verification, please ignore this email.</p>
          <p>Best regards,<br>The BedSpace Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 BedSpace. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: 'Verify Your Email - BedSpace',
    html,
    text: `Hello ${name}! Your BedSpace verification OTP is: ${otp}. This OTP will expire in 10 minutes.`,
  });
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to BedSpace</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to BedSpace!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}!</h2>
          <p>Welcome to BedSpace - your trusted platform for finding and listing bed spaces.</p>
          <p>You can now:</p>
          <ul>
            <li>Search for available bed spaces in your preferred location</li>
            <li>Connect with verified providers</li>
            <li>Book spaces that match your requirements</li>
            <li>Communicate securely through our messaging system</li>
          </ul>
          <p>If you're a provider, don't forget to complete your verification process to start listing your spaces.</p>
          <p>Happy space hunting!</p>
          <p>Best regards,<br>The BedSpace Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 BedSpace. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: 'Welcome to BedSpace!',
    html,
    text: `Welcome to BedSpace, ${name}! Start exploring available bed spaces or list your own. Happy space hunting!`,
  });
};

export const sendBookingNotificationEmail = async (
  email: string,
  name: string,
  listingTitle: string,
  status: 'approved' | 'rejected'
): Promise<boolean> => {
  const statusText = status === 'approved' ? 'Approved' : 'Rejected';
  const statusColor = status === 'approved' ? '#10b981' : '#ef4444';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking ${statusText} - BedSpace</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background: #f9f9f9; }
        .status { color: ${statusColor}; font-weight: bold; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>BedSpace</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}!</h2>
          <p>Your booking request for "<strong>${listingTitle}</strong>" has been <span class="status">${statusText.toLowerCase()}</span>.</p>
          ${status === 'approved' 
            ? '<p>Congratulations! You can now proceed with the next steps. The provider will contact you soon with further details.</p>'
            : '<p>Unfortunately, your booking request was not approved this time. Don\'t worry, there are many other great options available on BedSpace.</p>'
          }
          <p>You can view more details by logging into your BedSpace account.</p>
          <p>Best regards,<br>The BedSpace Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 BedSpace. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `Booking ${statusText} - BedSpace`,
    html,
    text: `Hello ${name}! Your booking request for "${listingTitle}" has been ${statusText.toLowerCase()}.`,
  });
};
