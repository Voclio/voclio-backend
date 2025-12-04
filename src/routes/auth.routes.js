const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authMiddleware, optionalAuth } = require('../middleware/auth.middleware');
const {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  otpValidator
} = require('../validators/auth.validator');

// Public routes
router.post('/register', registerValidator, AuthController.register);
router.post('/login', loginValidator, AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/send-otp', optionalAuth, otpValidator, AuthController.sendOTP);
router.post('/verify-otp', otpValidator, AuthController.verifyOTP);
router.post('/resend-otp', otpValidator, AuthController.resendOTP);
router.post('/forgot-password', AuthController.forgotPassword);

// Protected routes
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, updateProfileValidator, AuthController.updateProfile);
router.post('/logout', authMiddleware, AuthController.logout);

module.exports = router;
