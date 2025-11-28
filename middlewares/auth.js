module.exports = (req, res, next) => {
  req.user = { id: 'default-user-id' };
  next();
};
