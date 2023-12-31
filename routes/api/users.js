const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const authenticateToken = require("../../middleware/auth");
const User = require("../../models/User");

router.post(
  "/",
  [
    body("name", "Name is required!").notEmpty(),
    body("email", "Please enter valid email").notEmpty().isEmail(),
    body("age", "Age is required!").optional().isNumeric(),
    body("password", "Password with Minimum 6 character!").isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
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
  }
);

router.post(
  "/login",
  [
    body("type", "Type is required!").notEmpty(),
    body("type", "Type must be email or refresh").isIn(["email", "refresh"]),
  ],
  async (req, res) => {
    try {
      const { email, password, type, refreshToken } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      if (type == "email") {
        await handleEmailLogin(email, password, res);
      } else {
        handleRefreshTokenLogin(refreshToken, res);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something is wrong!" });
    }
  }
);

router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await User.find({});
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something is wrong!" });
  }
});

router.get("/profile", authenticateToken, async (req, res) => {
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

//! get an user by id

router.get("/:id", authenticateToken, async (req, res) => {
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

router.put("/:id", authenticateToken, async (req, res) => {
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

router.delete("/:id", authenticateToken, async (req, res) => {
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

module.exports = router;

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

function handleRefreshTokenLogin(refreshToken, res) {
  if (refreshToken) {
    jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, payload) => {
      if (err) {
        res.status(401).json({ msg: "Unauthorized" });
      } else {
        const id = payload.id;
        const user = await User.findById(id);

        if (!user) {
          res.status(401).json({ msg: "Unautorized" });
        } else {
          getUsersToken(user, res);
        }
      }
    });
  } else {
    res.status(401).json({ msg: "refreshToen is not defined!" });
  }
}

function getUsersToken(user, res) {
  const accessToken = jwt.sign(
    { email: user.email, id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "2d" }
  );
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "60d",
  });
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
