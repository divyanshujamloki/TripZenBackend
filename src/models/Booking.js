const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  seats: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'paid', 'confirmed', 'cancelled'],
    default: 'pending',
  },
  paymentId: { type: String },
  razorpayOrderId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
