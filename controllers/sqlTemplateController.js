const SqlTemplate = require('../models/SqlTemplate');
const { Op } = require('sequelize');

exports.createTemplate = async (req, res) => {
  try {
    const { name, description, content } = req.body;
    if (!name || !content) return res.status(400).json({ error: '模板名称和内容不能为空' });
    const template = await SqlTemplate.create({ name, description: description || '', content, userId: req.user.id });
    res.status(201).json({ message: '模板创建成功', template: { id: template.id, name: template.name, description: template.description } });
  } catch (error) {
    res.status(500).json({ error: '模板创建失败: ' + error.message });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const where = {};
    if (req.query && String(req.query.onlyEnabled) === 'true') where.isEnabled = true;
    if (req.query && String(req.query.onlyMine) === 'true') where.userId = req.user.id;
    const templates = await SqlTemplate.findAll({ where });
    res.json(templates.map(t => ({ id: t.id, name: t.name, description: t.description, isEnabled: t.isEnabled, createdAt: t.createdAt, updatedAt: t.updatedAt })));
  } catch (error) {
    res.status(500).json({ error: '获取模板失败: ' + error.message });
  }
};

exports.enableTemplate = async (req, res) => {
  try {
    const template = await SqlTemplate.findByPk(req.params.id);
    if (!template || template.userId !== req.user.id) return res.status(404).json({ error: '模板不存在' });
    await template.update({ isEnabled: true, updatedAt: new Date() });
    res.json({ message: '模板已启用' });
  } catch (error) {
    res.status(500).json({ error: '启用模板失败: ' + error.message });
  }
};

exports.disableTemplate = async (req, res) => {
  try {
    const template = await SqlTemplate.findByPk(req.params.id);
    if (!template || template.userId !== req.user.id) return res.status(404).json({ error: '模板不存在' });
    await template.update({ isEnabled: false, updatedAt: new Date() });
    res.json({ message: '模板已停用' });
  } catch (error) {
    res.status(500).json({ error: '停用模板失败: ' + error.message });
  }
};

exports.getTemplate = async (req, res) => {
  try {
    const template = await SqlTemplate.findByPk(req.params.id);
    if (!template || template.userId !== req.user.id) return res.status(404).json({ error: '模板不存在' });
    res.json({ id: template.id, name: template.name, description: template.description, content: template.content });
  } catch (error) {
    res.status(500).json({ error: '获取模板详情失败: ' + error.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { name, description, content } = req.body;
    const template = await SqlTemplate.findByPk(req.params.id);
    if (!template || template.userId !== req.user.id) return res.status(404).json({ error: '模板不存在' });
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content;
    updateData.updatedAt = new Date();
    await template.update(updateData);
    res.json({ message: '模板更新成功', template: { id: template.id, name: template.name, description: template.description } });
  } catch (error) {
    res.status(500).json({ error: '模板更新失败: ' + error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const where = { userId: req.user.id };
    const categories = await SqlTemplate.findAll({ where, attributes: ['category'], group: ['category'] });
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    const list = categories.map(c => c.category || '');
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: '获取模板分类失败: ' + error.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const template = await SqlTemplate.findByPk(req.params.id);
    if (!template || template.userId !== req.user.id) return res.status(404).json({ error: '模板不存在' });
    await template.destroy();
    res.json({ message: '模板删除成功' });
  } catch (error) {
    res.status(500).json({ error: '模板删除失败: ' + error.message });
  }
};

exports.copyTemplate = async (req, res) => {
  try {
    const template = await SqlTemplate.findByPk(req.params.id);
    if (!template || template.userId !== req.user.id) return res.status(404).json({ error: '模板不存在' });
    const newTemplate = await SqlTemplate.create({ name: `${template.name} (复制)`, description: template.description, content: template.content, userId: req.user.id });
    res.status(201).json({ message: '模板复制成功', template: { id: newTemplate.id, name: newTemplate.name, description: newTemplate.description } });
  } catch (error) {
      res.status(500).json({ error: '模板复制失败: ' + error.message });
  }
};

exports.exportTemplates = async (req, res) => {
  try {
    const { ids } = req.query;
    const where = { userId: req.user.id };
    if (ids) {
      const idArray = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (idArray.length > 0) where.id = { [Op.in]: idArray };
    }
    const templates = await SqlTemplate.findAll({ where });
    const exportData = templates.map(t => ({ name: t.name, description: t.description, content: t.content }));
    res.json({ templates: exportData, count: exportData.length });
  } catch (error) {
      res.status(500).json({ error: '导出模板失败: ' + error.message });
  }
};

exports.importTemplates = async (req, res) => {
  try {
    const { templates } = req.body;
    if (!Array.isArray(templates) || templates.length === 0) return res.status(400).json({ error: '模板数据格式错误' });
    const importedTemplates = [];
    const errors = [];
    for (let i = 0; i < templates.length; i++) {
      const t = templates[i];
      if (!t.name || !t.content) { errors.push(`第${i + 1}个模板：名称和内容不能为空`); continue; }
      try {
        const template = await SqlTemplate.create({ name: t.name, description: t.description || '', content: t.content, userId: req.user.id });
        importedTemplates.push({ id: template.id, name: template.name });
      } catch (err) { errors.push(`第${i + 1}个模板导入失败: ${err.message}`); }
    }
    res.json({ message: `成功导入${importedTemplates.length}个模板`, imported: importedTemplates, errors: errors.length > 0 ? errors : undefined });
  } catch (error) {
      res.status(500).json({ error: '导入模板失败: ' + error.message });
  }
};
