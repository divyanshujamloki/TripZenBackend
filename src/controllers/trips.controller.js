const Trip = require('../models/Trip');
const Question = require('../models/Question');

exports.listTrips = async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    const filter = status ? { status } : { status: { $in: ['upcoming', 'full'] } };
    const total = await Trip.countDocuments(filter);
    const trips = await Trip.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ trips, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTripBySlug = async (req, res) => {
  try {
    const trip = await Trip.findOne({ slug: req.params.slug });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ trip });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    const trip = await Trip.findOne({ slug: req.params.slug }).select('totalSeats bookedSeats');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({
      totalSeats: trip.totalSeats,
      bookedSeats: trip.bookedSeats,
      availableSeats: trip.totalSeats - trip.bookedSeats,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTripQuestions = async (req, res) => {
  try {
    const trip = await Trip.findOne({ slug: req.params.slug }).select('_id');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    const questions = await Question.find({
      tripId: trip._id,
      isPublic: true,
      answer: { $exists: true, $ne: '' },
    });
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.askQuestion = async (req, res) => {
  try {
    const trip = await Trip.findOne({ slug: req.params.slug }).select('_id');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    const { name, email, question } = req.body;
    const q = await Question.create({ tripId: trip._id, name, email, question });
    res.status(201).json({ question: q });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminListTrips = async (req, res) => {
  try {
    const trips = await Trip.find();
    res.json({ trips });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminGetTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ trip });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminCreateTrip = async (req, res) => {
  try {
    const trip = await Trip.create(req.body);
    res.status(201).json({ trip });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminUpdateTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ trip });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminDeleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ message: 'Trip deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
