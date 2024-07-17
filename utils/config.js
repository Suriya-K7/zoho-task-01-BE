//getting all Environment Variables

const URL = process.env.ATLAS_URI;
const PORT = process.env.PORT;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const JWT_SECRET = process.env.JWT_SECRET;
const BEURL = process.env.BEURL;
const FRONTEND_URL = process.env.FEURL;

//exporting all Environment Variables

module.exports = {
  URL,
  PORT,
  EMAIL_USER,
  EMAIL_PASS,
  JWT_SECRET,
  FRONTEND_URL,
  BEURL,
};