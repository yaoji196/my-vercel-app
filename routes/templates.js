const express = require('express');
const router = express.Router();
const sqlTemplateController = require('../controllers/sqlTemplateController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.post('/', sqlTemplateController.createTemplate);
router.get('/', sqlTemplateController.getTemplates);
router.post('/:id/enable', sqlTemplateController.enableTemplate);
router.post('/:id/disable', sqlTemplateController.disableTemplate);
router.get('/categories', sqlTemplateController.getCategories);
router.get('/:id', sqlTemplateController.getTemplate);
router.put('/:id', sqlTemplateController.updateTemplate);
router.delete('/:id', sqlTemplateController.deleteTemplate);
router.post('/:id/copy', sqlTemplateController.copyTemplate);
router.get('/export', sqlTemplateController.exportTemplates);
router.post('/import', sqlTemplateController.importTemplates);

module.exports = router;
