const User = require("../models/userModel");
const Token = require("../models/tokenModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const {
  EMAIL_PASS,
  EMAIL_USER,
  FRONTEND_URL,
  JWT_SECRET,
} = require("../utils/config");

// Generate Token
const generateToken = (user) => {
  return jwt.sign({ userId: user._id, userEmail: user.email }, JWT_SECRET, {
    expiresIn: "1d",
  });
};

//getting token

const getTokenFrom = (req) => {
  const authorization = req.get("authorization");

  if (authorization && authorization.startsWith("bearer ")) {
    return authorization.replace("bearer ", "");
  }
};

// Register User
const registerUser = async (req, res) => {
  try {
    //getting data from frontend
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      res.status(400).json({ message: "all fields are mandotary" });
      return;
    }

    // Check if user email already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    //generating random string for confirming user

    const randomString =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const link = `${FRONTEND_URL}/confirm/${randomString}`;

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      verifyToken: randomString,
    });

    //sending email for Confirm account

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const sendMail = async () => {
      const info = await transporter.sendMail({
        from: `"Udhayasooriyan" <${EMAIL_PASS}>`,
        to: user.email,
        subject: "Confirm account",
        text: link,
      });
    };

    sendMail();

    //sending response to front end

    res.status(201).json({
      message: `${user.name} Account has been Created, Please Check your Email and Activate Your Account`,
    });
    //
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Confirm User account
const confirmUser = async (req, res) => {
  try {
    //getting data from frontend using ID params
    const verifyToken = req.params.id;

    //getting matched user using verifytoken

    const matchedUser = await User.findOne({ verifyToken });

    //if user not found throw error

    if (matchedUser === null || matchedUser.verifyToken === "") {
      return res.status(400).json({
        message: "Account Already activated, Please proceed for login",
      });
    }

    //confirming and updating account
    matchedUser.isVerified = true;

    matchedUser.verifyToken = "";

    await User.findByIdAndUpdate(matchedUser._id, matchedUser);

    //sending data to FE
    res.status(201).json({
      message: `${matchedUser.name} account has been verified successfully, Please Proceed to Login`,
    });

    //
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    //getting data from FE

    const { email, password } = req.body;

    // Validate Request
    if (!email || !password) {
      res.status(400).json({ message: "all fields are mandotary" });
      return;
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "user not exist/Please Sign-up" });
    }

    // User exists, check if password is correct
    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    // if user password does not match send error
    if (!passwordIsCorrect) {
      return res.status(401).json({ message: "password incorrect" });
    }

    // if user not verified send error
    if (!user.isVerified) {
      return res
        .status(401)
        .json({ message: "Account not verfied, kindly check your Email" });
    }

    //   Generate Token
    const token = generateToken(user);

    const formatedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      age: user.age,
      mobile: user.mobile,
      gender: user.gender,
      DOB: user.DOB,
    };

    //sending data to FE

    res.status(200).json({ token, user: formatedUser });
    //
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// incase user forgot password
const forgotPassword = async (req, res) => {
  try {
    //getting data from FE

    const { email } = req.body;

    //getting matched user from database

    const user = await User.findOne({ email });

    //throw error if user not found
    if (!user) {
      res.status(400).json({ message: "User not exists" });
      return;
    }

    // Delete token if it exists in DB
    let token = await Token.findOne({ userId: user._id });

    if (token) {
      await token.deleteOne();
    }

    // Create Reste Token
    let resetToken = crypto.randomBytes(32).toString("hex") + user._id;

    // Hash token before saving to DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save Token to DB
    await new Token({
      userId: user._id,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
    }).save();

    // Construct Reset Url
    const resetUrl = `${FRONTEND_URL}/reset/${resetToken}`;

    // Reset Email
    const message = `
      <h2>Hello ${user.name}</h2>
      <p>Please use the url below to reset your password</p>  
      <p>This reset link is valid for only 30minutes.</p>

      <a href=${resetUrl} target="_blank">${resetUrl}</a>

      <p>Regards...</p>
      <p>Suriya Team</p>
    `;
    const subject = "Password Reset Request";

    //sending email for Confirm account

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const sendMail = async () => {
      const info = await transporter.sendMail({
        from: `"Udhayasooriyan" <${EMAIL_PASS}>`,
        to: user.email,
        subject,
        html: message,
      });
    };

    //sending mail with reset link

    sendMail();

    //sending response to frontend
    return res
      .status(201)
      .json({ message: `Mail has been send to ${user.email}` });
    //
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    //getting data & resdettoken from frontend

    const { password } = req.body;

    const { resetToken } = req.params;

    // Hash token, then compare to Token in DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // fIND tOKEN in DB
    const userToken = await Token.findOne({
      token: hashedToken,
      expiresAt: { $gt: Date.now() },
    });

    if (!userToken) {
      res.status(400).json({ message: "Link Expired, Please try again" });
      return;
    }

    // Find user and update password
    const user = await User.findOne({ _id: userToken.userId });

    user.password = password;

    await user.save();

    await userToken.deleteOne();

    //sending response data to FE

    res.status(200).json({
      message: "Password updated Successfully, Please Login",
    });
    //
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// update user

const updateUser = async (req, res) => {
  try {
    //verify the user token

    const token = getTokenFrom(req);

    if (!token) {
      return res.status(401).json({ message: "Not Authorized" });
    }

    const decodedToken = jwt.verify(token, JWT_SECRET);

    if (!decodedToken.userId) {
      return res
        .status(401)
        .json({ message: "session timeout please login again" });
    }

    //getting data from FE

    const { name, email, mobile, age, gender, DOB } = req.body;

    if (!name || !email || !mobile || !age || !gender || !DOB) {
      return res.status(401).json({ message: "Please provide all details" });
    }

    const matchedUser = await User.findOne({ email });

    if (matchedUser.id !== decodedToken.userId) {
      return res
        .status(401)
        .json({ message: "user not available please contact admin" });
    }

    matchedUser.name = name;
    matchedUser.mobile = mobile;
    matchedUser.age = age;
    matchedUser.gender = gender;
    matchedUser.DOB = DOB;

    const updatedUser = await matchedUser.save();

    //sending data to FE

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      mobile: updatedUser.mobile,
      email: updatedUser.email,
      age: updatedUser.age,
      gender: updatedUser.gender,
      DOB: updatedUser.DOB,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  confirmUser,
  loginUser,
  forgotPassword,
  resetPassword,
  updateUser,
};
