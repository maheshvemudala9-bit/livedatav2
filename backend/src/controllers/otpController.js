// controllers/otpController.js
const db             = require('../services/db');
const { sendOtpEmail } = require('../services/emailService');

// ─── Generate 6-digit OTP ─────────────────────────────────────────────────────
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── Send OTP ─────────────────────────────────────────────────────────────────
// POST /api/sendOtp
// Body: { email }
// Called when user submits signup form
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'Failure',
        result: 'Email is required.'
      });
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        status: 'Failure',
        result: 'Invalid email format.'
      });
    }

    // Normalize email (case-insensitive) so send/verify share one key.
    const normEmail = String(email).trim().toLowerCase();

    const otp = generateOtp();

    // Save OTP to DB with 10 min expiry
    await db.saveOtp(normEmail, otp);

    // Send OTP email
    await sendOtpEmail(normEmail, otp);

    return res.status(200).json({
      status: 'Success',
      result: `OTP sent to ${normEmail}. Valid for 10 minutes.`
    });

  } catch (error) {
    console.error('sendOtp error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
// POST /api/verifyOtp
// Body: { email, otp }
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: 'Failure',
        result: 'Email and OTP are required.'
      });
    }

    // Normalize email (case-insensitive) so verify uses the same key as send.
    const normEmail = String(email).trim().toLowerCase();

    const isValid = await db.verifyOtp(normEmail, otp);

    if (!isValid) {
      return res.status(200).json({
        status: 'Failure',
        result: 'Invalid or expired OTP. Please try again.'
      });
    }

    return res.status(200).json({
      status: 'Success',
      result: 'OTP verified successfully.'
    });

  } catch (error) {
    console.error('verifyOtp error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};