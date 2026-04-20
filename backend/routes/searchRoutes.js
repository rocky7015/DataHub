const express = require('express');
const {
  searchDatasets,
  getAllTags,
  getAllCategories,
  getSearchSuggestions,
  getPlatformStats,
} = require('../controllers/searchController');

const router = express.Router();

// @route  GET /api/search              – full search + filter
router.get('/', searchDatasets);

// @route  GET /api/search/tags         – tag cloud with counts
router.get('/tags', getAllTags);

// @route  GET /api/search/categories   – category list with counts
router.get('/categories', getAllCategories);

// @route  GET /api/search/suggestions  – autocomplete (title prefix)
router.get('/suggestions', getSearchSuggestions);

// @route  GET /api/search/stats        – platform-wide statistics
router.get('/stats', getPlatformStats);

module.exports = router;
