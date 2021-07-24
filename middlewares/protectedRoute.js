const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.header("AUTH-TOKEN");

  if (!token) {
    return res.json({
      errors: [{ msg: "token is required to access protected route" }]
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.jwtSecret);
    req.userid = decoded.userid;
    next();
  } catch (err) {
    return res.json({
      errors: [{ msg: "invalid token" }]
    });
  }
};
