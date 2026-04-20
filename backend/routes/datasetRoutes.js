const express = require('express');
const { body } = require('express-validator');
const {
  uploadDataset,
  getDatasets,
  getDatasetById,
  updateDataset,
  deleteDataset,
  downloadDataset,
  previewDataset,
  rateDataset,
  toggleBookmark,
} = require('../controllers/datasetController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// ─── Validation Rules ─────────────────────────────────────────────────────────

const uploadValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('category').optional().trim(),
];

const updateValidation = [
  body('title').optional().trim().isLength({ max: 100 }).withMessage('Title too long'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description too long'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// @route  GET  /api/datasets
router.get('/', getDatasets);

// @route  POST /api/datasets  (multipart/form-data with file)
router.post('/', protect, upload.single('file'), uploadValidation, uploadDataset);

// @route  GET  /api/datasets/:id
router.get('/:id', getDatasetById);

// @route  PUT  /api/datasets/:id
router.put('/:id', protect, updateValidation, updateDataset);

// @route  DELETE /api/datasets/:id
router.delete('/:id', protect, deleteDataset);

// @route  GET  /api/datasets/:id/download
router.get('/:id/download', downloadDataset);

// @route  GET  /api/datasets/:id/preview
router.get('/:id/preview', previewDataset);

// @route  POST /api/datasets/:id/rate
router.post('/:id/rate', protect, rateDataset);

// @route  POST /api/datasets/:id/bookmark
router.post('/:id/bookmark', protect, toggleBookmark);

module.exports = router;
