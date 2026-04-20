const Comment = require('../models/Comment');
const Dataset = require('../models/Dataset');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all comments for a dataset (threaded)
 * @route   GET /api/comments/dataset/:datasetId
 * @access  Public
 *
 * Returns top-level comments, each with a `replies` array populated.
 */
const getComments = async (req, res, next) => {
  try {
    const { datasetId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip     = (pageNum - 1) * limitNum;

    // Verify dataset exists
    const dataset = await Dataset.findById(datasetId).select('_id title');
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }

    // Fetch top-level comments (parentComment === null)
    const [topLevel, total] = await Promise.all([
      Comment.find({ dataset: datasetId, parentComment: null })
        .populate('author', 'username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Comment.countDocuments({ dataset: datasetId, parentComment: null }),
    ]);

    // Fetch all replies for these top-level comments in a single query
    const topLevelIds = topLevel.map((c) => c._id);
    const replies = await Comment.find({ parentComment: { $in: topLevelIds } })
      .populate('author', 'username avatar')
      .sort({ createdAt: 1 })
      .lean();

    // Attach replies to their parent comment
    const replyMap = {};
    replies.forEach((r) => {
      const parentId = String(r.parentComment);
      if (!replyMap[parentId]) replyMap[parentId] = [];
      replyMap[parentId].push(r);
    });

    const threads = topLevel.map((c) => ({
      ...c,
      replies: replyMap[String(c._id)] || [],
    }));

    res.json({
      success: true,
      count: threads.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      dataset: { _id: dataset._id, title: dataset.title },
      comments: threads,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a top-level comment to a dataset
 * @route   POST /api/comments/dataset/:datasetId
 * @access  Private
 */
const addComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { datasetId } = req.params;
    const { content } = req.body;

    const dataset = await Dataset.findById(datasetId).select('_id');
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }

    const comment = await Comment.create({
      dataset: datasetId,
      author: req.user._id,
      content,
      parentComment: null,
    });

    await comment.populate('author', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Comment added',
      comment: { ...comment.toObject(), replies: [] },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reply to an existing comment
 * @route   POST /api/comments/:id/reply
 * @access  Private
 */
const replyToComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const parentComment = await Comment.findById(req.params.id);
    if (!parentComment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Replies always attach to a top-level comment — flatten to one level of nesting
    const rootParentId = parentComment.parentComment || parentComment._id;

    const reply = await Comment.create({
      dataset: parentComment.dataset,
      author: req.user._id,
      content: req.body.content,
      parentComment: rootParentId,
    });

    await reply.populate('author', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Reply added',
      comment: reply,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Edit a comment (author only)
 * @route   PUT /api/comments/:id
 * @access  Private
 */
const editComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (String(comment.author) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this comment' });
    }

    comment.content = req.body.content;
    await comment.save();
    await comment.populate('author', 'username avatar');

    res.json({ success: true, message: 'Comment updated', comment });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a comment and all its replies (author or admin)
 * @route   DELETE /api/comments/:id
 * @access  Private
 */
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (String(comment.author) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    // If it's a top-level comment, delete all its replies too
    if (!comment.parentComment) {
      await Comment.deleteMany({ parentComment: comment._id });
    }

    await comment.deleteOne();

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get comment count per dataset (for dataset cards)
 * @route   GET /api/comments/dataset/:datasetId/count
 * @access  Public
 */
const getCommentCount = async (req, res, next) => {
  try {
    const count = await Comment.countDocuments({ dataset: req.params.datasetId });
    res.json({ success: true, count });
  } catch (error) {
    next(error);
  }
};

module.exports = { getComments, addComment, replyToComment, editComment, deleteComment, getCommentCount };
