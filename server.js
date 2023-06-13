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
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
    password: String,
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
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(req.body.password, salt);
    const userObj = {
      name: req.body.name,
      email: req.body.email,
      age: req.body.age,
      password: password,
    };
    let user = new User(userObj);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something is wrong!" });
  }
});

//! login user

app.post("/users/login", async (req, res) => {
  try {
    const { email, password, type, refreshToken } = req.body;

    if (type == "email") {
      await handleEmailLogin(email, password, res);

    } else {
      handleRefreshTokenLogin(refreshToken, res);
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something is wrong!" });
  }
});

//! middleware to authenticate JWT access tokens

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        res.status(401).json("Unauthorized");
      } else {
        req.user = user;
        next();
      }
    });
  } else {
    res.status(401).json("Unauthorized");
    return;
  }
};

//? get user profile

app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const id = req.user.id;
    const user = await User.findById(id);
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

//! get all users

app.get("/users", authenticateToken, async (req, res) => {
  try {
    const user = await User.find({});
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something is wrong!" });
  }
});

//! get an user by id

app.get("/users/:id", authenticateToken, async (req, res) => {
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

app.put("/users/:id", authenticateToken, async (req, res) => {
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

app.delete("/users/:id", authenticateToken, async (req, res) => {
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

function handleRefreshTokenLogin(refreshToken, res) {
  if (refreshToken) {
    jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, payload) => {
      if (err) {
        res.status(401).json({ msg: 'Unauthorized' });
      } else {
        const id = payload.id;
        const user = await User.findById(id);

        if (!user) {
          res.status(401).json({ msg: 'Unautorized' });
        } else {
          getUsersToken(user, res);
        }
      }
    });
  } else {
    res.status(401).json({ msg: "refreshToen is not defined!" });
  }
}

async function handleEmailLogin(email, password, res) {
  const user = await User.findOne({ email: email });

  if (user) {
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (isValidPassword) {
      getUsersToken(user, res);
    } else {
      res.status(401).json({ msg: "Wrong Password" });
    }
  } else {
    res.status(404).json("404 user not found");
  }
}

function getUsersToken(user, res) {
  const accessToken = jwt.sign(
    { email: user.email, id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "2m" }
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "3m" }
  );
  const userObj = user.toJSON();
  userObj["accessToken"] = accessToken;
  userObj["refreshToken"] = refreshToken;
  res.status(200).json(userObj);
  console.log("Login Successful!");
}

function getUserById(req) {
  const uid = req.params.id;
  const user = User.findById(uid);
  return user;
}
