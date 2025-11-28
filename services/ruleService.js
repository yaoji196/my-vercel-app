const Rule = require('../models/Rule');
const SqlTemplate = require('../models/SqlTemplate');

exports.matchRules = async (headers, rules) => {
  const matchedRules = [];
  for (const rule of rules) {
    if (!rule.isEnabled) continue;
    if (rule.triggerCondition) {
      if (checkTriggerCondition(headers, rule.triggerCondition)) {
        const template = await SqlTemplate.findByPk(rule.templateId);
        if (template) matchedRules.push({ ...rule.toJSON(), templateContent: template.content });
      }
    } else {
      const template = await SqlTemplate.findByPk(rule.templateId);
      if (template) matchedRules.push({ ...rule.toJSON(), templateContent: template.content });
    }
  }
  return matchedRules;
};

function checkTriggerCondition(headers, triggerCondition) {
  if (!triggerCondition || !headers || headers.length === 0) return false;
  try {
    const condition = JSON.parse(triggerCondition);
    const normalized = headers.map(h => String(h || '').trim().toLowerCase());
    const findInHeaders = (col) => normalized.includes(String(col || '').trim().toLowerCase());
    if (condition.type === 'column_match') {
      if (Array.isArray(condition.columns)) return condition.columns.some(col => findInHeaders(col));
      else if (typeof condition.columns === 'string') return findInHeaders(condition.columns);
    } else if (condition.type === 'all_columns') {
      if (Array.isArray(condition.columns)) return condition.columns.every(col => findInHeaders(col));
    } else if (condition.type === 'regex') {
      if (condition.pattern) { const regex = new RegExp(condition.pattern); return headers.some(header => regex.test(header)); }
    } else if (condition.type === 'value_condition') {
      if (condition.column) return findInHeaders(condition.column);
    }
  } catch (e) {
    const conditionStr = String(triggerCondition).trim();
    const normalized = headers.map(h => String(h || '').trim().toLowerCase());
    const findInHeaders = (col) => normalized.includes(String(col || '').trim().toLowerCase());
    if (conditionStr.includes(',')) { const columns = conditionStr.split(',').map(c => c.trim()); return columns.some(col => findInHeaders(col)); }
    return findInHeaders(conditionStr);
  }
  return false;
}

exports.getColumnMappings = (rule, rowData) => {
  const mappings = {};
  if (rule.columnMappings && typeof rule.columnMappings === 'object') Object.assign(mappings, rule.columnMappings);
  if (Object.keys(mappings).length === 0) { Object.keys(rowData).forEach(key => { mappings[key] = key; }); }
  return mappings;
};
