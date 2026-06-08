const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/trips', require('./trips.routes'));
router.use('/bookings', require('./bookings.routes'));
router.use('/payments', require('./payments.routes'));
router.use('/contact', require('./contact.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
