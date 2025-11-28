const express = require('express');
const router = express.Router();
const generateController = require('../controllers/generateController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/history', generateController.getGenerationHistory);
router.get('/history/:id', generateController.getGenerationDetail);
router.get('/files/:id/preview', generateController.getFileDataForPreview);
router.post('/generate', generateController.generateAndReturnSQL);
module.exports = router;
