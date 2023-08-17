/**
 * ! command for running :
 * ! "npm init -y" (if we want to use package.json with default settings. otherwise , run
 * ? "npm init")
 * ! next step: run "npm i --save express"
 * ! next step: run "npm i --save body-parser"
 * ? if we want to install express and body-parse with 1 command, we simply run "npm i --save express body-parser"
 * ! next step: run "npm i --save-dev nodemon"
 * ! npm i --save multer
 */

/**
 * ! Task manager app:
 * ? 1/ User can create a task
 */

require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const multer = require("multer");
const connectDB = require("./config/db");

app.use(bodyParser.json());
const port = process.env.PORT;

// const upload = multer({ dest: './public/uploads/' })

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    // const uniqueSuffix = 'shakib75.jpg'
    //cb(null, file.fieldname + '-' + file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage })

//mongodb connection

connectDB();

//routes

app.use("/users", require("./routes/api/users"));
app.use("/tasks", require("./routes/api/tasks"));

app.post("/uploads", upload.single("file"), (req, res) => {
  res.json({ message: "file is uploaded" });
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get("/", (req, res) => {
  res.json({ message: "Welcome to my app" });
});
