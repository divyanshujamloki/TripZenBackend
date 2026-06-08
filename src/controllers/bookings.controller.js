const Booking = require('../models/Booking');
const Trip = require('../models/Trip');

exports.createBooking = async (req, res) => {
  try {
    const { tripId, seats } = req.body;
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (trip.totalSeats - trip.bookedSeats < seats) {
      return res.status(400).json({ message: 'Not enough seats available' });
    }

    const totalAmount = trip.pricePerPerson * seats;
    const booking = await Booking.create({
      userId: req.user._id,
      tripId,
      seats,
      totalAmount,
    });
    res.status(201).json({ booking, razorpayOrderId: booking.razorpayOrderId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.myBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id }).populate(
      'tripId',
      'title slug coverImage startDate endDate'
    );
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('tripId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const data = booking.toObject();
    if (booking.status === 'paid' || booking.status === 'confirmed') {
      data.whatsappGroupLink = booking.tripId.whatsappGroupLink;
    }
    res.json({ booking: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('tripId userId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json({
      invoice: {
        bookingId: booking._id,
        user: { name: booking.userId.name, email: booking.userId.email },
        trip: {
          title: booking.tripId.title,
          startDate: booking.tripId.startDate,
          endDate: booking.tripId.endDate,
          location: booking.tripId.location,
        },
        seats: booking.seats,
        totalAmount: booking.totalAmount,
        currency: booking.tripId.currency,
        status: booking.status,
        createdAt: booking.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('tripId', 'title slug');
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
