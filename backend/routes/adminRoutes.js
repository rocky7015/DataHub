const express = require('express');
const {
  getPlatformStats,
  getAllUsers,
  getAllDatasets,
  updateDatasetStatus,
  deleteUserByAdmin,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth & admin checks to all routes in this file
router.use(protect, adminOnly);

// @route   GET /api/admin/stats
router.get('/stats', getPlatformStats);

// @route   GET /api/admin/users
router.get('/users', getAllUsers);

// @route   DELETE /api/admin/users/:id
router.delete('/users/:id', deleteUserByAdmin);

// @route   GET /api/admin/datasets
router.get('/datasets', getAllDatasets);

// @route   PUT /api/admin/datasets/:id/status
router.put('/datasets/:id/status', updateDatasetStatus);

module.exports = router;
