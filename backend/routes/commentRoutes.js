const express = require('express');
const { body } = require('express-validator');
const {
  getComments,
  addComment,
  replyToComment,
  editComment,
  deleteComment,
  getCommentCount,
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ─── Validation ───────────────────────────────────────────────────────────────
const contentValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content is required')
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// @route  GET  /api/comments/dataset/:datasetId          – get threaded comments
router.get('/dataset/:datasetId', getComments);

// @route  GET  /api/comments/dataset/:datasetId/count    – comment count
router.get('/dataset/:datasetId/count', getCommentCount);

// @route  POST /api/comments/dataset/:datasetId          – add top-level comment
router.post('/dataset/:datasetId', protect, contentValidation, addComment);

// @route  POST /api/comments/:id/reply                   – reply to a comment
router.post('/:id/reply', protect, contentValidation, replyToComment);

// @route  PUT  /api/comments/:id                         – edit comment
router.put('/:id', protect, contentValidation, editComment);

// @route  DELETE /api/comments/:id                       – delete comment (+replies)
router.delete('/:id', protect, deleteComment);

module.exports = router;
