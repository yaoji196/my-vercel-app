const express = require('express');
const router = express.Router();
const ruleController = require('../controllers/ruleController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.post('/', ruleController.createRule);
router.get('/', ruleController.getRules);
router.get('/raw/:id', ruleController.getRawRule);
router.get('/categories', ruleController.getCategories);
router.get('/:id', ruleController.getRule);
router.put('/:id', ruleController.updateRule);
router.delete('/:id', ruleController.deleteRule);
router.post('/:id/copy', ruleController.copyRule);
router.post('/:id/enable', ruleController.enableRule);
router.post('/:id/disable', ruleController.disableRule);

module.exports = router;
