const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname || '');
    const base = path.basename(file.originalname || 'upload', ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 80);
    cb(null, `${timestamp}_${base}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image uploads are allowed'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.post(
  '/register',
  upload.single('profilePic'),
  [
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').optional().isIn(['customer', 'deliver', 'merchant'])
  ],
  authController.register
);

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

// Upload/update profile photo
router.post('/profile/photo', auth, upload.single('profilePic'), authController.updateProfilePhoto);

router.post('/change-password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], authController.changePassword);

router.post('/forgot-password', [body('email').isEmail()], authController.forgotPassword);
router.post('/reset-password/:token', [body('newPassword').isLength({ min: 6 })], authController.resetPassword);

// Removed profile photo upload and fetch routes

router.put('/update/fcm-token',auth, authController.updateFCMToken);

module.exports = router;


