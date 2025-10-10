const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

router.post('/register', [
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['customer', 'deliver', 'merchant'])
], authController.register);

router.get('/verify-email/:token/:hint', authController.verifyEmail);

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], authController.login);

router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);

router.put('/profile', auth, [
  body('firstName').optional().notEmpty(),
  body('lastName').optional().notEmpty(),
], authController.updateProfile);

router.post('/change-password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], authController.changePassword);

router.post('/forgot-password', [body('email').isEmail()], authController.forgotPassword);
router.post('/reset-password/:token', [body('newPassword').isLength({ min: 6 })], authController.resetPassword);

router.post('/update-fcm-token', authController.updateFCMToken);

module.exports = router;


