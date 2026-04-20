const express = require('express');
const { body } = require('express-validator');
const {
  getUserProfile,
  getUserDatasets,
  getMyDashboard,
  updateProfile,
  getMyBookmarks,
  deleteAccount,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ─── Validation ───────────────────────────────────────────────────────────────
const profileValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username: letters, numbers, underscores only'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Bio cannot exceed 300 characters'),
  body('avatar')
    .optional()
    .trim()
    .isURL().withMessage('Avatar must be a valid URL'),
];

// ─── Private routes (must come BEFORE /:identifier to avoid conflicts) ────────

// @route  GET    /api/users/dashboard/me
router.get('/dashboard/me', protect, getMyDashboard);

// @route  GET    /api/users/bookmarks/me
router.get('/bookmarks/me', protect, getMyBookmarks);

// @route  PUT    /api/users/profile
router.put('/profile', protect, profileValidation, updateProfile);

// @route  DELETE /api/users/account
router.delete('/account', protect, deleteAccount);

// ─── Public routes ────────────────────────────────────────────────────────────

// @route  GET    /api/users/:identifier          (username or ObjectId)
router.get('/:identifier', getUserProfile);

// @route  GET    /api/users/:identifier/datasets
router.get('/:identifier/datasets', getUserDatasets);

module.exports = router;
