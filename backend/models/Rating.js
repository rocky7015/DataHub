const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema(
  {
    dataset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dataset',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
  },
  { timestamps: true }
);

// Enforce one rating per user per dataset
RatingSchema.index({ dataset: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Rating', RatingSchema);
