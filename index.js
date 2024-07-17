// required config

require("dotenv").config();
const express = require("express");
const app = express();

const cors = require("cors");
const mongoose = require("mongoose");
const { URL, PORT } = require("./utils/config");

// getting all routers

const authRouter = require("./routes/authRouter");

// setup app
app.use(express.json());
app.use(cors());

mongoose.set("strictQuery", false);

mongoose
  .connect(URL)
  .then(() => {
    console.log("connected to Mongo DB");
  })
  .catch((err) => {
    console.error(err);
  });

app.get("/", (req, res) => {
  res.send("Welcome to ZOHO Task 1");
});

app.use(authRouter);

app.listen(PORT, () => {
  console.log(`server is running in ${PORT}`);
});
