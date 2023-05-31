/**
 * ! command for running :
 * ! "npm init -y" (if we want to use package.json with default settings. otherwise , run
 * ? "npm init")
 * ! next step: run "npm i --save express"
 * ! next step: run "npm i --save body-parser"
 * ? if we want to install express and body-parse with 1 command, we simply run "npm i --save express body-parser"
 * ! next step: run "npm i --save-dev nodemon"
 */

require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
app.use(bodyParser.json());
const port = process.env.PORT;

//mongodb connection
const uri = process.env.MONGODB_URI;
mongoose
  .connect(uri, { useNewUrlParser: true })
  .then(() => console.log("Connected!"));

//create schema
const userSchema = mongoose.Schema(
  {
    name: String,
    email: String,
    age: Number,
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get("/", (req, res) => {
  res.json({ message: "Welcome to my app" });
});

// const users = []
let uid = 0;

//! create users

app.post("/users", async (req, res) => {
  try {
    let user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something is wrong!" });
  }
});

//! get all users

app.get("/users", async (req, res) => {
  try {
    const user = await User.find({});
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something is wrong!" });
  }
});

//! get an user by id

app.get("/users/:id", async (req, res) => {
  const user = await getUserById(req);

  try {
    if (user) {
      res.json(user);
    } else {
      res.status(404).json("404 user not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something is wrong!" });
  }
});

//! update an user by id

app.put("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;
    const user = await User.findByIdAndUpdate(id, body, { new: true });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json("404 user not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something is wrong!" });
  }
});

//! delete an user by id

app.delete("/users/:id", async(req, res) => {
  try {
    const uid = req.params.id;
    const user = await User.findByIdAndDelete(uid);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json("404 user not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something is wrong!" });
  }
});

function getUserById(req) {
  const uid = req.params.id;
  const user = User.findById(uid);
  return user;
}
