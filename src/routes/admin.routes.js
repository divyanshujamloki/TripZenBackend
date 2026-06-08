const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const trips = require('../controllers/trips.controller');
const bookings = require('../controllers/bookings.controller');
const questions = require('../controllers/questions.controller');

router.use(protect, adminOnly);

router.get('/trips', trips.adminListTrips);
router.post('/trips', trips.adminCreateTrip);
router.get('/trips/:id', trips.adminGetTrip);
router.put('/trips/:id', trips.adminUpdateTrip);
router.delete('/trips/:id', trips.adminDeleteTrip);

router.get('/bookings', bookings.adminAllBookings);

router.get('/questions', questions.listQuestions);
router.patch('/questions/:id', questions.answerQuestion);

module.exports = router;
