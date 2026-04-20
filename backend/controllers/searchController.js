const Dataset = require('../models/Dataset');
const User = require('../models/User');
const NodeCache = require('node-cache');

// Cache stats for 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

/**
 * @desc    Advanced dataset search with full filtering & sorting
 * @route   GET /api/search
 * @access  Public
 *
 * Query params:
 *   q         – free-text search (title, description, tags)
 *   tags      – comma-separated tag list (OR match)
 *   category  – category name (case-insensitive)
 *   fileType  – csv | json | xlsx | tsv | txt
 *   uploader  – contributor username OR ObjectId
 *   from      – ISO date string (createdAt >=)
 *   to        – ISO date string (createdAt <=)
 *   minRating – minimum averageRating (0–5)
 *   sort      – newest | oldest | downloads | views | rating | title
 *   page      – page number (default 1)
 *   limit     – results per page (default 12, max 50)
 */
const searchDatasets = async (req, res, next) => {
  try {
    const {
      q,
      tags,
      category,
      fileType,
      uploader,
      from,
      to,
      minRating,
      sort = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isPublic: true, status: 'approved' };

    // ── Full-text search ──────────────────────────────────────────────────────
    if (q && q.trim()) {
      query.$text = { $search: q.trim() };
    }

    // ── Tag filter (OR — any of the provided tags) ────────────────────────────
    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      if (tagList.length) query.tags = { $in: tagList };
    }

    // ── Category filter ───────────────────────────────────────────────────────
    if (category) {
      query.category = { $regex: new RegExp(category.trim(), 'i') };
    }

    // ── File-type filter ──────────────────────────────────────────────────────
    if (fileType) {
      query.fileType = fileType.toLowerCase().replace('.', '');
    }

    // ── Uploader: resolve username → ObjectId ────────────────────────────────
    if (uploader) {
      // If it looks like an ObjectId, use directly; otherwise search by username
      const isObjectId = /^[a-f\d]{24}$/i.test(uploader);
      if (isObjectId) {
        query.uploader = uploader;
      } else {
        const uploaderUser = await User.findOne({
          username: { $regex: new RegExp(`^${uploader}$`, 'i') },
        });
        if (!uploaderUser) {
          // No user → return empty result set immediately
          return res.json({
            success: true,
            count: 0,
            total: 0,
            page: 1,
            pages: 0,
            datasets: [],
          });
        }
        query.uploader = uploaderUser._id;
      }
    }

    // ── Date range filter ─────────────────────────────────────────────────────
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to)   query.createdAt.$lte = new Date(to);
    }

    // ── Minimum rating filter ─────────────────────────────────────────────────
    if (minRating) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }

    // ── Sort mapping ──────────────────────────────────────────────────────────
    const SORT_MAP = {
      newest:    { createdAt: -1 },
      oldest:    { createdAt: 1 },
      downloads: { downloadCount: -1 },
      views:     { viewCount: -1 },
      rating:    { averageRating: -1, ratingCount: -1 },
      title:     { title: 1 },
    };
    const sortObj = SORT_MAP[sort] ?? SORT_MAP.newest;

    // ── Pagination ────────────────────────────────────────────────────────────
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    // ── Query + count in parallel ─────────────────────────────────────────────
    const [datasets, total] = await Promise.all([
      Dataset.find(query)
        .populate('uploader', 'username avatar')
        .sort(sortObj)
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
      filters: { q, tags, category, fileType, uploader, from, to, minRating, sort },
      datasets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all unique tags with usage counts (for tag cloud / suggestions)
 * @route   GET /api/search/tags
 * @access  Public
 */
const getAllTags = async (req, res, next) => {
  try {
    const tags = await Dataset.aggregate([
      { $match: { isPublic: true, status: 'approved' } },
      { $unwind: '$tags' },
      { $group: { _id: { $toLower: '$tags' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 100 },
      { $project: { _id: 0, tag: '$_id', count: 1 } },
    ]);

    res.json({ success: true, count: tags.length, tags });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all unique categories with dataset counts
 * @route   GET /api/search/categories
 * @access  Public
 */
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Dataset.aggregate([
      { $match: { isPublic: true, status: 'approved' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, category: '$_id', count: 1 } },
    ]);

    res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Autocomplete / search suggestions (title prefix match)
 * @route   GET /api/search/suggestions?q=...
 * @access  Public
 */
const getSearchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const regex = new RegExp(q.trim(), 'i');

    const datasets = await Dataset.find(
      { title: regex, isPublic: true, status: 'approved' },
      { title: 1, category: 1, fileType: 1 }
    )
      .limit(8)
      .lean();

    const suggestions = datasets.map((d) => ({
      _id: d._id,
      title: d.title,
      category: d.category,
      fileType: d.fileType,
    }));

    res.json({ success: true, suggestions });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Platform-wide statistics
 * @route   GET /api/search/stats
 * @access  Public
 */
const getPlatformStats = async (req, res, next) => {
  try {
    const cachedStats = cache.get('platform_stats');
    if (cachedStats) {
      return res.json({ success: true, stats: cachedStats });
    }

    const [datasetStats, userCount] = await Promise.all([
      Dataset.aggregate([
        { $match: { isPublic: true, status: 'approved' } },
        {
          $group: {
            _id: null,
            totalDatasets: { $sum: 1 },
            totalDownloads: { $sum: '$downloadCount' },
            totalViews:     { $sum: '$viewCount' },
            avgRating:      { $avg: '$averageRating' },
          },
        },
      ]),
      User.countDocuments(),
    ]);

    const stats = datasetStats[0] || { totalDatasets: 0, totalDownloads: 0, totalViews: 0, avgRating: 0 };
    delete stats._id;

    const statsPayload = {
      ...stats,
      avgRating: parseFloat((stats.avgRating || 0).toFixed(2)),
      totalUsers: userCount,
    };

    cache.set('platform_stats', statsPayload);
    res.json({ success: true, stats: statsPayload });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchDatasets,
  getAllTags,
  getAllCategories,
  getSearchSuggestions,
  getPlatformStats,
};
