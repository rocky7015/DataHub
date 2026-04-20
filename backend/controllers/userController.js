const User = require('../models/User');
const Dataset = require('../models/Dataset');
const Comment = require('../models/Comment');
const { validationResult } = require('express-validator');

/**
 * @desc    Get public user profile by ID or username
 * @route   GET /api/users/:identifier
 * @access  Public
 */
const getUserProfile = async (req, res, next) => {
  try {
    const { identifier } = req.params;

    // Accept either MongoDB ObjectId or username
    const isObjectId = /^[a-f\d]{24}$/i.test(identifier);
    const query = isObjectId ? { _id: identifier } : { username: identifier };

    const user = await User.findOne(query).select('-password -bookmarks');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Public dataset count & aggregate stats for this user
    const [datasetStats, commentCount] = await Promise.all([
      Dataset.aggregate([
        { $match: { uploader: user._id, isPublic: true, status: 'approved' } },
        {
          $group: {
            _id: null,
            totalDatasets: { $sum: 1 },
            totalDownloads: { $sum: '$downloadCount' },
            totalViews: { $sum: '$viewCount' },
            avgRating: { $avg: '$averageRating' },
          },
        },
      ]),
      Comment.countDocuments({ author: user._id }),
    ]);

    const stats = datasetStats[0] || {
      totalDatasets: 0,
      totalDownloads: 0,
      totalViews: 0,
      avgRating: 0,
    };
    delete stats._id;
    stats.avgRating = parseFloat((stats.avgRating || 0).toFixed(2));
    stats.totalComments = commentCount;

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
      },
      stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all public datasets uploaded by a user
 * @route   GET /api/users/:identifier/datasets
 * @access  Public
 */
const getUserDatasets = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const { page = 1, limit = 12, sort = '-createdAt' } = req.query;

    const isObjectId = /^[a-f\d]{24}$/i.test(identifier);
    const query = isObjectId ? { _id: identifier } : { username: identifier };
    const user = await User.findOne(query).select('_id username');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip     = (pageNum - 1) * limitNum;

    const datasetQuery = { uploader: user._id, isPublic: true, status: 'approved' };

    const [datasets, total] = await Promise.all([
      Dataset.find(datasetQuery)
        .populate('uploader', 'username avatar')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Dataset.countDocuments(datasetQuery),
    ]);

    res.json({
      success: true,
      user: { _id: user._id, username: user.username },
      count: datasets.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      datasets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's full private dashboard (own datasets + bookmarks + stats)
 * @route   GET /api/users/dashboard/me
 * @access  Private
 */
const getMyDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Run all aggregations in parallel
    const [allMyDatasets, bookmarkedDatasets, activityStats] = await Promise.all([
      // All datasets (public + private) for the logged-in owner
      Dataset.find({ uploader: userId })
        .sort({ createdAt: -1 })
        .lean(),

      // Bookmarked datasets (populated)
      User.findById(userId)
        .select('bookmarks')
        .populate({
          path: 'bookmarks',
          select: 'title fileType averageRating downloadCount viewCount createdAt uploader',
          populate: { path: 'uploader', select: 'username avatar' },
        })
        .lean(),

      // Aggregate activity stats across all owned datasets
      Dataset.aggregate([
        { $match: { uploader: userId } },
        {
          $group: {
            _id: null,
            totalDatasets: { $sum: 1 },
            publicDatasets: { $sum: { $cond: ['$isPublic', 1, 0] } },
            totalDownloads: { $sum: '$downloadCount' },
            totalViews: { $sum: '$viewCount' },
            avgRating: { $avg: '$averageRating' },
            totalRatings: { $sum: '$ratingCount' },
          },
        },
      ]),
    ]);

    const stats = activityStats[0] || {
      totalDatasets: 0,
      publicDatasets: 0,
      totalDownloads: 0,
      totalViews: 0,
      avgRating: 0,
      totalRatings: 0,
    };
    delete stats._id;
    stats.avgRating = parseFloat((stats.avgRating || 0).toFixed(2));

    // Top performing datasets by downloads
    const topDatasets = [...allMyDatasets]
      .sort((a, b) => b.downloadCount - a.downloadCount)
      .slice(0, 5);

    res.json({
      success: true,
      stats,
      recentDatasets: allMyDatasets.slice(0, 10),
      topDatasets,
      bookmarks: bookmarkedDatasets?.bookmarks || [],
      bookmarkCount: bookmarkedDatasets?.bookmarks?.length || 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update logged-in user's profile (bio, avatar)
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { bio, avatar, username } = req.body;

    // Check if new username is already taken by another user
    if (username && username !== req.user.username) {
      const exists = await User.findOne({ username });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Username already taken' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
        ...(username && { username }),
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's bookmarks
 * @route   GET /api/users/bookmarks/me
 * @access  Private
 */
const getMyBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('bookmarks')
      .populate({
        path: 'bookmarks',
        select: 'title description fileType averageRating downloadCount viewCount tags createdAt uploader',
        populate: { path: 'uploader', select: 'username avatar' },
      });

    res.json({
      success: true,
      count: user.bookmarks.length,
      bookmarks: user.bookmarks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete the logged-in user's account + all their data
 * @route   DELETE /api/users/account
 * @access  Private
 */
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Remove all their datasets, comments
    const userDatasets = await Dataset.find({ uploader: userId }).select('_id');
    const datasetIds = userDatasets.map((d) => d._id);

    await Promise.all([
      Dataset.deleteMany({ uploader: userId }),
      Comment.deleteMany({ author: userId }),
      Comment.deleteMany({ dataset: { $in: datasetIds } }),
      User.findByIdAndDelete(userId),
    ]);

    res.json({ success: true, message: 'Account and all associated data deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  getUserDatasets,
  getMyDashboard,
  updateProfile,
  getMyBookmarks,
  deleteAccount,
};
