const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['image', 'video'], required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  format: { type: String },
  width: { type: Number },
  height: { type: Number },
  bytes: { type: Number },
  originalName: { type: String },
  caption: { type: String },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
}, { timestamps: true });

module.exports = mongoose.model('Media', mediaSchema);
