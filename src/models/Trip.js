const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  location: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  pricePerPerson: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  totalSeats: { type: Number, required: true },
  bookedSeats: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'upcoming', 'full', 'completed', 'cancelled'],
    required: true,
  },
  description: { type: String, required: true },
  coverImage: { type: String, required: true },
  gallery: [{ type: { type: String }, url: String, caption: String }],
  inclusions: [String],
  exclusions: [String],
  itinerary: [{ day: Number, title: String, activities: [String] }],
  whatsappGroupLink: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
