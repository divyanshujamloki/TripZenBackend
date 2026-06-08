const router = require('express').Router();
const c = require('../controllers/trips.controller');

router.get('/', c.listTrips);
router.get('/:slug/availability', c.getAvailability);
router.get('/:slug/questions', c.getTripQuestions);
router.post('/:slug/questions', c.askQuestion);
router.get('/:slug', c.getTripBySlug);

module.exports = router;
