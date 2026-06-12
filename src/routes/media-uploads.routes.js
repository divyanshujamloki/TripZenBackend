const router = require('express').Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const media = require('../controllers/media.controller');

router.use(protect);

router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, media.uploadMedia);

router.get('/', media.listMedia);
router.get('/:id', media.getMedia);
router.delete('/:id', media.deleteMedia);

module.exports = router;
