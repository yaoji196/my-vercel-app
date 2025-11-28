const File = require('../models/File');
const Rule = require('../models/Rule');
const SqlTemplate = require('../models/SqlTemplate');
const { matchRules, getColumnMappings } = require('./ruleService');
const { Op } = require('sequelize');

exports.generateSQL = async (fileId, ruleIds = []) => {
  try {
    const file = await File.findByPk(fileId);
    if (!file) throw new Error('文件不存在');
    if (!file.data || !file.data.headers || !file.data.data) throw new Error('文件数据格式错误');
    let rules = [];
    if (ruleIds && ruleIds.length > 0) {
      const ruleIdNumbers = ruleIds.map(id => parseInt(id)).filter(id => !isNaN(id));
      if (ruleIdNumbers.length > 0) rules = await Rule.findAll({ where: { id: { [Op.in]: ruleIdNumbers }, isEnabled: true } });
    } else {
      rules = await Rule.findAll({ where: { isEnabled: true } });
    }
    if (rules.length === 0) throw new Error('没有可用的规则，请先创建并启用规则');
    const matchedRules = await matchRules(file.data.headers, rules);
    if (matchedRules.length === 0) throw new Error('没有匹配的规则，请检查规则的触发条件');
    const sqlResults = [];
    const errors = [];
    for (let rowIndex = 0; rowIndex < file.data.data.length; rowIndex++) {
      const row = file.data.data[rowIndex];
      for (const rule of matchedRules) {
        try {
          if (!evaluateRuleTrigger(rule, row, file.data.headers)) continue;
          const sql = generateSingleSQL(rule, row, file.data.headers);
          if (sql) sqlResults.push({ ruleId: rule.id.toString(), ruleName: rule.name, category: rule.category || '', sql: sql, rowData: { ...row }, rowIndex: rowIndex + 1 });
        } catch (error) {
          errors.push({ rowIndex: rowIndex + 1, ruleName: rule.name, error: error.message });
        }
      }
    }
    return { sqlResults, errors: errors.length > 0 ? errors : undefined, totalRows: file.data.data.length, matchedRulesCount: matchedRules.length };
  } catch (error) { throw error; }
};

function generateSingleSQL(rule, rowData, headers) {
  if (!rule.templateContent) throw new Error('规则模板内容为空');
  let sql = rule.templateContent;
  const columnMappings = getColumnMappings(rule, rowData);
  const placeholderRegex = /\$\{([^}]+)\}/g;
  const missingPlaceholders = [];
  sql = sql.replace(placeholderRegex, (match, placeholder) => {
    const placeholderName = placeholder.trim();
    let value = null;
    if (columnMappings[placeholderName]) { const mappedColumn = columnMappings[placeholderName]; value = rowData[mappedColumn]; }
    else value = rowData[placeholderName];
    if (value === null || value === undefined) { missingPlaceholders.push(placeholderName); return ''; }
    const escapedValue = escapeSqlValue(value);
    return escapedValue;
  });
  if (missingPlaceholders.length > 0) {}
  if (!validateSQL(sql)) throw new Error(`生成的SQL无效: ${sql.substring(0, 100)}...`);
  return sql.trim();
}

function evaluateRuleTrigger(rule, rowData, headers) {
  const tc = rule.triggerCondition; if (!tc) return true;
  try {
    const cond = JSON.parse(tc);
    if (cond.type === 'value_condition') {
      const col = cond.column; const op = cond.operator; const val = cond.value; if (!col) return false;
      const normalizedHeaders = headers.map(h => String(h || '').trim().toLowerCase());
      const targetIndex = normalizedHeaders.indexOf(String(col || '').trim().toLowerCase()); if (targetIndex === -1) return false;
      const actualCol = headers[targetIndex]; const cellValue = rowData[actualCol]; if (cellValue === null || cellValue === undefined) return false;
      const a = String(cellValue); const b = String(val);
      switch (op) { case '=': return a === b; case '!=': return a !== b; case 'contains': return a.indexOf(b) !== -1; case 'startsWith': return a.startsWith(b); case 'endsWith': return a.endsWith(b); case '>': { const na = parseFloat(a); const nb = parseFloat(b); if (Number.isNaN(na) || Number.isNaN(nb)) return false; return na > nb; } case '<': { const na = parseFloat(a); const nb = parseFloat(b); if (Number.isNaN(na) || Number.isNaN(nb)) return false; return na < nb; } default: return false; }
    }
  } catch (e) { return headers.includes(tc); }
  return false;
}

function escapeSqlValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';
  const str = String(value);
  return "'" + str.replace(/'/g, "''") + "'";
}

function validateSQL(sql) { if (!sql || typeof sql !== 'string' || sql.trim().length === 0) return false; const validKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP']; const sqlUpper = sql.trim().toUpperCase(); return validKeywords.some(keyword => sqlUpper.startsWith(keyword)); }
