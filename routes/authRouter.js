//setting up Router

const authRouter = require("express").Router();

//importing required controller

const {
  registerUser,
  confirmUser,
  loginUser,
  forgotPassword,
  resetPassword,
  updateUser,
} = require("../controllers/authController");

/*****************sign up new user*********************/

authRouter.post("/auth/register", registerUser);

/*****************Confirm new user*********************/

authRouter.patch("/auth/confirm/:id", confirmUser);

/****************** User Login ************************/

authRouter.post("/auth/login", loginUser);

/****************** forgot Password ************************/

authRouter.put("/auth/forgotPassword", forgotPassword);

/****************** forgot Password ************************/

authRouter.patch("/auth/resetPassword/:resetToken", resetPassword);

/*****************update user*********************/

authRouter.patch("/auth/update", updateUser);

//exporting router

module.exports = authRouter;
