const Rule = require('../models/Rule');
const SqlTemplate = require('../models/SqlTemplate');

exports.createRule = async (req, res) => {
  try {
    const { name, description, triggerCondition, templateId, columnMappings, isEnabled, category } = req.body;

    const rule = await Rule.create({
      name,
      description,
      triggerCondition,
      category: category || '订单',
      templateId: parseInt(templateId),
      columnMappings: columnMappings || {},
      isEnabled: isEnabled !== undefined ? isEnabled : true,
      userId: req.user.id
    });
    
    res.status(201).json({ message: '规则创建成功', rule: { id: rule.id, name: rule.name, description: rule.description, category: rule.category } });
    } catch (error) {
    res.status(500).json({ error: '规则创建失败: ' + error.message });
  }
};

exports.getRules = async (req, res) => {
  try {
    const models = require('../models/index');
    const RuleModel = models.Rule || Rule;
    const SqlTemplateModel = models.SqlTemplate || SqlTemplate;
    
    const whereClause = { userId: req.user.id };
    const { category } = req.query;
    if (category !== undefined && category !== '') {
      whereClause.category = category;
    }

    const rules = await RuleModel.findAll({ where: whereClause, include: [{ model: SqlTemplateModel, as: 'template', attributes: ['name'] }], order: [['createdAt', 'DESC']] });
    
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    res.json(rules.map(r => ({ id: r.id, name: r.name, description: r.description, category: r.category || '', triggerCondition: r.triggerCondition, templateName: r.template?.name || '', isEnabled: r.isEnabled, createdAt: r.createdAt })));
  } catch (error) {
    res.status(500).json({ error: '获取规则失败: ' + error.message });
  }
};

exports.getRule = async (req, res) => {
  try {
    const rule = await Rule.findByPk(req.params.id);
    if (!rule || rule.userId !== req.user.id) return res.status(404).json({ error: '规则不存在' });
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    res.json({ id: rule.id, name: rule.name, description: rule.description, category: rule.category || '', triggerCondition: rule.triggerCondition, templateId: rule.templateId, columnMappings: rule.columnMappings || {}, isEnabled: rule.isEnabled, createdAt: rule.createdAt });
  } catch (error) {
    res.status(500).json({ error: '获取规则详情失败: ' + error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const models = require('../models/index');
    const RuleModel = models.Rule || Rule;

    const categories = await RuleModel.findAll({ where: { userId: req.user.id }, attributes: ['category'], group: ['category'] });

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    const list = categories.map(c => c.category || '');
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: '获取规则分类失败: ' + error.message });
  }
};

exports.updateRule = async (req, res) => {
  try {
    const { name, description, triggerCondition, templateId, columnMappings, isEnabled, category } = req.body;
    const rule = await Rule.findByPk(req.params.id);
    if (!rule || rule.userId !== req.user.id) return res.status(404).json({ error: '规则不存在' });
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (triggerCondition !== undefined) updateData.triggerCondition = triggerCondition;
    if (category !== undefined) updateData.category = category;
    if (templateId !== undefined && templateId !== '' && !Number.isNaN(parseInt(templateId))) updateData.templateId = parseInt(templateId);
    if (columnMappings !== undefined) updateData.columnMappings = columnMappings;
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    updateData.updatedAt = new Date();
    await rule.update(updateData);
    await rule.reload();
    res.json({ message: '规则更新成功', rule: { id: rule.id, name: rule.name, description: rule.description, category: rule.category || '' } });
  } catch (error) {
    res.status(500).json({ error: '规则更新失败: ' + error.message });
  }
};

exports.deleteRule = async (req, res) => {
  try {
    const rule = await Rule.findByPk(req.params.id);
    if (!rule || rule.userId !== req.user.id) return res.status(404).json({ error: '规则不存在' });
    await rule.destroy();
    res.json({ message: '规则删除成功' });
  } catch (error) {
    res.status(500).json({ error: '规则删除失败: ' + error.message });
  }
};

exports.copyRule = async (req, res) => {
  try {
    const rule = await Rule.findByPk(req.params.id);
    if (!rule || rule.userId !== req.user.id) return res.status(404).json({ error: '规则不存在' });
    const newRule = await Rule.create({ name: `${rule.name} (复制)`, description: rule.description, triggerCondition: rule.triggerCondition, category: rule.category || '', templateId: rule.templateId, columnMappings: rule.columnMappings || {}, isEnabled: rule.isEnabled, userId: req.user.id });
    res.status(201).json({ message: '规则复制成功', rule: { id: newRule.id, name: newRule.name } });
  } catch (error) {
    res.status(500).json({ error: '规则复制失败: ' + error.message });
  }
};

exports.enableRule = async (req, res) => {
  try {
    const rule = await Rule.findByPk(req.params.id);
    if (!rule || rule.userId !== req.user.id) return res.status(404).json({ error: '规则不存在' });
    await rule.update({ isEnabled: true });
    res.json({ message: '规则已启用' });
  } catch (error) {
    res.status(500).json({ error: '启用规则失败: ' + error.message });
  }
};

exports.disableRule = async (req, res) => {
  try {
    const rule = await Rule.findByPk(req.params.id);
    if (!rule || rule.userId !== req.user.id) return res.status(404).json({ error: '规则不存在' });
    await rule.update({ isEnabled: false });
    res.json({ message: '规则已禁用' });
  } catch (error) {
    res.status(500).json({ error: '禁用规则失败: ' + error.message });
  }
};

exports.getRawRule = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const models = require('../models/index');
    const sequelize = models.getSequelize();
    const { QueryTypes } = require('sequelize');

    const rows = await sequelize.query('SELECT * FROM rules WHERE id = ?', { replacements: [id], type: QueryTypes.SELECT });
    if (!rows || rows.length === 0) return res.status(404).json({ error: '规则未找到（raw 查询）' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: '获取规则原始行失败: ' + error.message });
  }
};
