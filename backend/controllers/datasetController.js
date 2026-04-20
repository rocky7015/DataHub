const Dataset = require('../models/Dataset');
const Rating = require('../models/Rating');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Upload a new dataset
 * @route   POST /api/datasets
 * @access  Private
 */
const uploadDataset = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Remove uploaded file if validation fails
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const { title, description, tags, category } = req.body;

    // Parse tags — accept either JSON array string or comma-separated string
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags
          .replace(/[\[\]"]/g, '') // strip brackets & quotes from raw curl output
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }

    const fileExt = path.extname(req.file.originalname).replace('.', '').toLowerCase();

    const dataset = await Dataset.create({
      title,
      description,
      tags: parsedTags,
      category: category || 'General',
      fileUrl: req.file.path.startsWith('http') ? req.file.path : `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: fileExt,
      uploader: req.user._id,
    });

    await dataset.populate('uploader', 'username email avatar');

    res.status(201).json({
      success: true,
      message: 'Dataset uploaded successfully',
      dataset,
    });
  } catch (error) {
    // Clean up file if DB write fails
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(error);
  }
};

/**
 * @desc    Get all datasets (with search, filter, pagination)
 * @route   GET /api/datasets
 * @access  Public
 */
const getDatasets = async (req, res, next) => {
  try {
    const {
      search,
      tags,
      category,
      uploader,
      page = 1,
      limit = 12,
      sort = '-createdAt',
    } = req.query;

    const query = { isPublic: true, status: 'approved' };

    // Full-text search on title + description + tags
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by tags (comma-separated)
    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim());
      query.tags = { $in: tagList };
    }

    // Filter by category
    if (category) {
      query.category = { $regex: new RegExp(category, 'i') };
    }

    // Filter by uploader ID
    if (uploader) {
      query.uploader = uploader;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit)); // cap at 50
    const skip = (pageNum - 1) * limitNum;

    const [datasets, total] = await Promise.all([
      Dataset.find(query)
        .populate('uploader', 'username avatar')
        .sort(sort)
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
 * @desc    Get single dataset by ID (increments viewCount)
 * @route   GET /api/datasets/:id
 * @access  Public
 */
const getDatasetById = async (req, res, next) => {
  try {
    const dataset = await Dataset.findById(req.params.id)
      .populate('uploader', 'username email avatar bio');

    if (!dataset || (!dataset.isPublic && String(dataset.uploader._id) !== String(req.user?._id))) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }

    // Increment view count
    await Dataset.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    res.json({ success: true, dataset });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update dataset metadata
 * @route   PUT /api/datasets/:id
 * @access  Private (owner only)
 */
const updateDataset = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }

    // Only owner or admin can update
    if (String(dataset.uploader) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this dataset' });
    }

    const { title, description, tags, category, isPublic } = req.body;

    let parsedTags = dataset.tags;
    if (tags !== undefined) {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    const updated = await Dataset.findByIdAndUpdate(
      req.params.id,
      {
        title: title ?? dataset.title,
        description: description ?? dataset.description,
        tags: parsedTags,
        category: category ?? dataset.category,
        isPublic: isPublic !== undefined ? isPublic : dataset.isPublic,
      },
      { new: true, runValidators: true }
    ).populate('uploader', 'username avatar');

    res.json({ success: true, message: 'Dataset updated', dataset: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete dataset
 * @route   DELETE /api/datasets/:id
 * @access  Private (owner or admin)
 */
const deleteDataset = async (req, res, next) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }

    if (String(dataset.uploader) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this dataset' });
    }

    // Delete the physical file if local
    if (!dataset.fileUrl.startsWith('http')) {
      const filePath = path.join(__dirname, '..', dataset.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await dataset.deleteOne();

    res.json({ success: true, message: 'Dataset deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download dataset file (increments downloadCount)
 * @route   GET /api/datasets/:id/download
 * @access  Public
 */
const downloadDataset = async (req, res, next) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }
    if (dataset.fileUrl.startsWith('http')) {
      // For cloud storage, redirect to the URL
      return res.redirect(dataset.fileUrl);
    }

    const filePath = path.join(__dirname, '..', dataset.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    // Increment download count
    await Dataset.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } });

    res.download(filePath, dataset.fileName);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Preview first N rows of a CSV/JSON dataset
 * @route   GET /api/datasets/:id/preview
 * @access  Public
 */
const previewDataset = async (req, res, next) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }

    let fileContent;
    
    if (dataset.fileUrl.startsWith('http')) {
      // In production with cloud storage, we would use axios.get(dataset.fileUrl) to fetch the file buffer
      // For this implementation, we will just return a placeholder for cloud files
      return res.json({ success: true, preview: { type: dataset.fileType, message: 'Preview is not available for remote cloud files currently.' } });
    } else {
      const filePath = path.join(__dirname, '..', dataset.fileUrl);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File not found on server' });
      }
      fileContent = fs.readFileSync(filePath, 'utf8');
    }

    const ext = dataset.fileType.toLowerCase();
    const MAX_ROWS = 10;

    let preview = null;

    if (ext === 'json') {
      const parsed = JSON.parse(fileContent);
      const data = Array.isArray(parsed) ? parsed : [parsed];
      preview = { type: 'json', rows: data.slice(0, MAX_ROWS), total: data.length };
    } else if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
      const delimiter = ext === 'tsv' ? '\t' : ',';
      const lines = fileContent.split('\n').filter((l) => l.trim());
      const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1, MAX_ROWS + 1).map((line) => {
        const values = line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''));
        return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] ?? '' }), {});
      });
      preview = { type: 'csv', headers, rows, totalLines: lines.length - 1 };
    } else {
      preview = { type: ext, message: `Preview not available for .${ext} files` };
    }

    res.json({ success: true, preview });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Rate a dataset (1–5 stars)
 * @route   POST /api/datasets/:id/rate
 * @access  Private
 */
const rateDataset = async (req, res, next) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }

    // Upsert rating (update if exists, create if not)
    await Rating.findOneAndUpdate(
      { dataset: req.params.id, user: req.user._id },
      { rating },
      { upsert: true, new: true }
    );

    // Recalculate average rating
    const stats = await Rating.aggregate([
      { $match: { dataset: dataset._id } },
      { $group: { _id: '$dataset', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    const avg = stats.length ? parseFloat(stats[0].avg.toFixed(1)) : 0;
    const count = stats.length ? stats[0].count : 0;

    await Dataset.findByIdAndUpdate(req.params.id, {
      averageRating: avg,
      ratingCount: count,
    });

    res.json({ success: true, message: 'Rating submitted', averageRating: avg, ratingCount: count });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bookmark or un-bookmark a dataset
 * @route   POST /api/datasets/:id/bookmark
 * @access  Private
 */
const toggleBookmark = async (req, res, next) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    const alreadyBookmarked = user.bookmarks.includes(req.params.id);

    if (alreadyBookmarked) {
      user.bookmarks = user.bookmarks.filter((b) => String(b) !== req.params.id);
    } else {
      user.bookmarks.push(req.params.id);
    }

    await user.save();

    res.json({
      success: true,
      message: alreadyBookmarked ? 'Bookmark removed' : 'Dataset bookmarked',
      bookmarked: !alreadyBookmarked,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDataset,
  getDatasets,
  getDatasetById,
  updateDataset,
  deleteDataset,
  downloadDataset,
  previewDataset,
  rateDataset,
  toggleBookmark,
};
