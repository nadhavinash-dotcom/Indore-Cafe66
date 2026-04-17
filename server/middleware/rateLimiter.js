const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Bahut zyada OTP requests. 10 minute baad try karo.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'RATE_LIMIT', message: 'Bahut zyada requests. Thoda ruko.' },
});

module.exports = { otpLimiter, apiLimiter };
