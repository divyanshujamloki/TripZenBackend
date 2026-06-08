const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String },
  isPublic: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
