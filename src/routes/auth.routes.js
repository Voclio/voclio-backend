import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.middleware.js';
const router = express.Router();
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  otpValidator
} from '../validators/auth.validator.js';

// Public routes
router.post('/register', registerValidator, AuthController.register);
router.post('/login', loginValidator, AuthController.login);
router.post('/google', AuthController.googleLogin);
router.post('/facebook', AuthController.facebookLogin);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/send-otp', optionalAuth, otpValidator, AuthController.sendOTP);
router.post('/verify-otp', otpValidator, AuthController.verifyOTP);
router.post('/resend-otp', otpValidator, AuthController.resendOTP);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Protected routes
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, updateProfileValidator, AuthController.updateProfile);
router.put('/change-password', authMiddleware, AuthController.changePassword);
router.post('/logout', authMiddleware, AuthController.logout);

export default router;
