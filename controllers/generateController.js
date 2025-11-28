const { generateSQL } = require('../services/sqlService');
const File = require('../models/File');
const History = require('../models/History');
const Rule = require('../models/Rule');
const { Op } = require('sequelize');

exports.generateSQL = async (req, res) => {
  try {
    const { fileId, ruleIds } = req.body;
    const file = await File.findByPk(fileId);
    if (!file) return res.status(404).json({ error: '文件不存在' });
    res.status(501).json({ error: '此接口尚未完全实现，请使用 /generate 返回结果的接口' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateAndReturnSQL = async (req, res) => {
  try {
    const { fileId, ruleIds } = req.body;
    const file = await File.findByPk(fileId);
    if (!file) return res.status(404).json({ error: '文件不存在' });

    const result = await generateSQL(fileId, ruleIds);

    const history = await History.create({
      fileId: parseInt(fileId),
      ruleIds: result.sqlResults.map(s => parseInt(s.ruleId)),
      sqlCount: result.sqlResults.length,
      sqlResults: result.sqlResults.map(s => s.sql),
      userId: req.user.id
    });

    res.json({
      success: true,
      sqlCount: result.sqlResults.length,
      sqlResults: result.sqlResults,
      errors: result.errors,
      totalRows: result.totalRows,
      matchedRulesCount: result.matchedRulesCount,
      historyId: history.id
    });
  } catch (error) {
    res.status(500).json({ error: 'SQL生成失败: ' + error.message });
  }
};

exports.getFileDataForPreview = async (req, res) => {
  try {
    const file = await File.findByPk(req.params.id);
    if (!file) return res.status(404).json({ error: '文件不存在' });
    if (!file.data || !file.data.headers || !file.data.data) return res.status(400).json({ error: '文件数据格式错误' });
    res.json({ headers: file.data.headers, previewData: file.data.data.slice(0, 10) });
  } catch (error) {
    res.status(500).json({ error: '获取文件预览数据失败: ' + error.message });
  }
};

exports.getGenerationHistory = async (req, res) => {
  try {
    const models = require('../models/index');
    const HistoryModel = models.History || History;
    const FileModel = models.File || File;
    const histories = await HistoryModel.findAll({
      where: { userId: req.user.id },
      include: [{ model: FileModel, as: 'file', attributes: ['originalName', 'size'] }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.json(histories.map(h => ({ id: h.id, fileName: h.file ? h.file.originalName : '未知文件', fileSize: h.file ? h.file.size : 0, sqlCount: h.sqlCount, createdAt: h.createdAt })));
  } catch (error) {
    res.status(500).json({ error: '获取生成历史失败: ' + error.message });
  }
};

exports.getGenerationDetail = async (req, res) => {
  try {
    const models = require('../models/index');
    const HistoryModel = models.History || History;
    const FileModel = models.File || File;
    const history = await HistoryModel.findByPk(req.params.id, { include: [{ model: FileModel, as: 'file' }] });
    if (!history) return res.status(404).json({ error: '生成记录不存在' });

    let fileData = null;
    if (history.file && history.file.data) {
      fileData = { headers: history.file.data.headers, previewData: history.file.data.data.slice(0, 10) };
    }

    const ruleIds = history.ruleIds || [];
    const rules = [];
    if (ruleIds.length > 0) {
      const models = require('../models/index');
      const RuleModel = models.Rule || Rule;
      const foundRules = await RuleModel.findAll({ where: { id: { [Op.in]: ruleIds } }, attributes: ['id', 'name', 'description'] });
      rules.push(...foundRules);
    }

    res.json({
      id: history.id,
      fileId: history.file ? history.file.id : null,
      fileName: history.file ? history.file.originalName : '未知文件',
      fileData: fileData,
      rules: rules,
      sqlCount: history.sqlCount,
      sqlResults: (history.sqlResults || []).map(item => {
        if (!item) return { sql: '' };
        if (typeof item === 'string') return { sql: item };
        if (typeof item === 'object' && item.sql !== undefined) return item;
        return { sql: String(item) };
      }),
      createdAt: history.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: '获取生成详情失败: ' + error.message });
  }
};
