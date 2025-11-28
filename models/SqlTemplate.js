function getModel() {
  const models = require('./index');
  if (models.SqlTemplate) return models.SqlTemplate;
  throw new Error('SqlTemplate 模型未初始化，请先调用 initModels()');
}

const modelProxy = {
  get(target, prop) {
    const model = getModel();
    const value = model[prop];
    if (typeof value === 'function') return value.bind(model);
    return value;
  }
};

module.exports = new Proxy({}, modelProxy);
