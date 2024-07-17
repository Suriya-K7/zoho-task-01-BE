//importing required

const jwt = require("jsonwebtoken");

//importing JWT secret ket from .env

const { JWT_SECRET } = require("../utils/config");

const verifyToken = async (req, res, next) => {
  try {
    //getting token from header

    let token = req.header("Authorization");

    //verifing token

    if (!token) {
      return res.status(403).json({ message: "Session timeout" });
    }

    if (token.startsWith("bearer")) {
      token = token.slice(7, token.length).trimLeft();
    }

    //verifing token

    const verified = jwt.verify(token, JWT_SECRET);

    // retriving user details from token

    req.user = verified;

    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { verifyToken };
