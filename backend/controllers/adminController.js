const User = require('../models/User');
const Dataset = require('../models/Dataset');
const Comment = require('../models/Comment');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 300 }); // Cache admin stats for 5 mins

/**
 * @desc    Get platform-wide statistics for the admin dashboard
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getPlatformStats = async (req, res, next) => {
  try {
    const cachedStats = cache.get('admin_platform_stats');
    if (cachedStats) {
      return res.json({ success: true, stats: cachedStats });
    }

    const [userCount, datasetStats, commentCount] = await Promise.all([
      User.countDocuments(),
      Dataset.aggregate([
        {
          $group: {
            _id: null,
            totalDatasets: { $sum: 1 },
            pendingDatasets: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            totalDownloads: { $sum: '$downloadCount' },
            totalStorageSize: { $sum: '$fileSize' },
          },
        },
      ]),
      Comment.countDocuments(),
    ]);

    const stats = datasetStats[0] || { totalDatasets: 0, pendingDatasets: 0, totalDownloads: 0, totalStorageSize: 0 };
    
    const statsPayload = {
      totalUsers: userCount,
      totalDatasets: stats.totalDatasets,
      pendingDatasets: stats.pendingDatasets,
      totalDownloads: stats.totalDownloads,
      totalStorageSize: stats.totalStorageSize,
      totalComments: commentCount,
    };

    cache.set('admin_platform_stats', statsPayload);

    res.json({
      success: true,
      stats: statsPayload,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users (paginated)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all datasets (including pending, paginated)
 * @route   GET /api/admin/datasets
 * @access  Private/Admin
 */
const getAllDatasets = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status) query.status = status;

    const [datasets, total] = await Promise.all([
      Dataset.find(query)
        .populate('uploader', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Dataset.countDocuments(query),
    ]);

    res.json({
      success: true,
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
 * @desc    Update a dataset's status (approve/reject/pending)
 * @route   PUT /api/admin/datasets/:id/status
 * @access  Private/Admin
 */
const updateDatasetStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) return res.status(404).json({ success: false, message: 'Dataset not found' });

    dataset.status = status;
    await dataset.save();

    res.json({ success: true, message: `Dataset status updated to ${status}`, dataset });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user and cascade delete datasets/comments
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
const deleteUserByAdmin = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (String(req.user._id) === userId) {
      return res.status(400).json({ success: false, message: 'You cannot delete yourself from the admin panel' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Cascade delete
    const userDatasets = await Dataset.find({ uploader: userId }).select('_id');
    const datasetIds = userDatasets.map((d) => d._id);

    await Promise.all([
      Dataset.deleteMany({ uploader: userId }),
      Comment.deleteMany({ author: userId }),
      Comment.deleteMany({ dataset: { $in: datasetIds } }),
      User.findByIdAndDelete(userId),
    ]);

    res.json({ success: true, message: 'User and all associated data deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlatformStats,
  getAllUsers,
  getAllDatasets,
  updateDatasetStatus,
  deleteUserByAdmin,
};
