const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/bookings.controller');

router.use(protect);
router.post('/', c.createBooking);
router.get('/', c.myBookings);
router.get('/:id/invoice', c.getInvoice);
router.get('/:id', c.getBooking);

module.exports = router;
