function getModel() {
  const models = require('./index');
  if (models.History) return models.History;
  throw new Error('History 模型未初始化，请先调用 initModels()');
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
