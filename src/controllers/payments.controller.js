const crypto = require('crypto');
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function isMockOrderId(orderId) {
  return String(orderId || '').startsWith('order_mock_');
}

function isMockPayment(paymentId, signature) {
  return String(paymentId || '').startsWith('pay_mock_') || signature === 'mock';
}

function allowMockPayments() {
  return process.env.ALLOW_MOCK_PAYMENTS === 'true' || process.env.NODE_ENV !== 'production';
}

exports.createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('tripId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const rzp = getRazorpay();
    if (!rzp) {
      const orderId = `order_mock_${Date.now()}`;
      booking.razorpayOrderId = orderId;
      await booking.save();
      return res.json({
        orderId,
        amount: booking.totalAmount * 100,
        currency: booking.tripId.currency || 'INR',
        keyId: 'mock_key',
        mock: true,
      });
    }

    const order = await rzp.orders.create({
      amount: Math.round(booking.totalAmount * 100),
      currency: booking.tripId.currency || 'INR',
      receipt: booking._id.toString().slice(-12),
    });

    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      mock: false,
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

    const rzp = getRazorpay();
    const mockOrder = isMockOrderId(razorpayOrderId);
    const mockPayment = isMockPayment(razorpayPaymentId, razorpaySignature);

    if (mockOrder || mockPayment) {
      if (!allowMockPayments()) {
        return res.status(400).json({
          message: 'Mock payment is not allowed in production. Create a new booking and complete payment via Razorpay checkout.',
          code: 'MOCK_PAYMENT_NOT_ALLOWED',
        });
      }
    } else if (rzp) {
      const expectedSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (expectedSig !== razorpaySignature) {
        return res.status(400).json({
          message: 'Payment verification failed. Invalid Razorpay signature.',
          code: 'INVALID_SIGNATURE',
        });
      }
    } else {
      return res.status(400).json({
        message: 'Razorpay is not configured and mock payments are disabled.',
        code: 'PAYMENT_NOT_CONFIGURED',
      });
    }

    booking.status = 'paid';
    booking.paymentId = razorpayPaymentId;
    booking.razorpayOrderId = razorpayOrderId;
    await booking.save();

    await Trip.findByIdAndUpdate(booking.tripId, { $inc: { bookedSeats: booking.seats } });

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
