const crypto = require('crypto');
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');

exports.createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('tripId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const orderId = `order_mock_${Date.now()}`;
    booking.razorpayOrderId = orderId;
    await booking.save();

    res.json({
      orderId,
      amount: booking.totalAmount * 100,
      currency: booking.tripId.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'mock_key',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret';
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (process.env.NODE_ENV === 'production' && expectedSig !== razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    booking.status = 'paid';
    booking.paymentId = razorpayPaymentId;
    await booking.save();

    await Trip.findByIdAndUpdate(booking.tripId, { $inc: { bookedSeats: booking.seats } });

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
