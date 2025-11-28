const { DataTypes } = require('sequelize');

let sequelize = null;

const getSequelize = () => {
  if (!sequelize) {
    const db = require('../config/db');
    sequelize = db.getSequelize();
    if (!sequelize) throw new Error('数据库未初始化，请先调用 initDatabase()。当前 sequelize 实例为 null。');
  }
  return sequelize;
};

let models = { File: null, SqlTemplate: null, Rule: null, History: null };

module.exports = {
  getSequelize,
  initModels: async () => {
    const sequelize = getSequelize();
    if (!sequelize) throw new Error('数据库未连接，无法初始化模型');

    models.File = sequelize.define('File', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      originalName: { type: DataTypes.STRING(255), allowNull: false, field: 'original_name', comment: '原始文件名,保持UTF-8编码' },
      fileName: { type: DataTypes.STRING(255), allowNull: false, field: 'file_name' },
      size: { type: DataTypes.BIGINT, allowNull: false },
      mimetype: { type: DataTypes.STRING(100), allowNull: false },
      data: { type: DataTypes.JSON, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' }
    }, { tableName: 'files', timestamps: true, updatedAt: false });

    models.SqlTemplate = sequelize.define('SqlTemplate', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      category: { type: DataTypes.STRING(100), allowNull: true },
      content: { type: DataTypes.TEXT, allowNull: false },
      isEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_enabled' },
      userId: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'default-user-id', field: 'user_id' },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' }
    }, { tableName: 'sql_templates', timestamps: true });

    models.Rule = sequelize.define('Rule', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      triggerCondition: { type: DataTypes.TEXT, allowNull: true, field: 'trigger_condition' },
      category: { type: DataTypes.STRING(100), allowNull: true, field: 'category' },
      templateId: { type: DataTypes.INTEGER, allowNull: false, field: 'template_id', references: { model: 'sql_templates', key: 'id' } },
      columnMappings: { type: DataTypes.JSON, allowNull: true, defaultValue: {}, field: 'column_mappings' },
      isEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_enabled' },
      userId: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'default-user-id', field: 'user_id' },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' }
    }, { tableName: 'rules', timestamps: true });

    models.History = sequelize.define('History', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      fileId: { type: DataTypes.INTEGER, allowNull: false, field: 'file_id', references: { model: 'files', key: 'id' } },
      ruleIds: { type: DataTypes.JSON, allowNull: true, defaultValue: [], field: 'rule_ids' },
      sqlCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'sql_count' },
      sqlResults: { type: DataTypes.JSON, allowNull: true, defaultValue: [], field: 'sql_results' },
      userId: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'default-user-id', field: 'user_id' },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' }
    }, { tableName: 'histories', timestamps: true, updatedAt: false });

    models.Rule.belongsTo(models.SqlTemplate, { foreignKey: 'templateId', as: 'template' });
    models.History.belongsTo(models.File, { foreignKey: 'fileId', as: 'file' });

    const syncOptions = { alter: process.env.NODE_ENV === 'development', force: false };
    try { await sequelize.sync(syncOptions); } catch (error) { throw error; }

    module.exports.File = models.File;
    module.exports.SqlTemplate = models.SqlTemplate;
    module.exports.Rule = models.Rule;
    module.exports.History = models.History;
    return models;
  }
};

module.exports.getModel = (modelName) => {
  if (!models[modelName]) throw new Error(`模型 ${modelName} 未初始化，请先调用 initModels()`);
  return models[modelName];
};
