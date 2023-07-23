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

const connectDB = require("./config/db");

app.use(bodyParser.json());
const port = process.env.PORT;

//mongodb connection

connectDB()

//routes

app.use('/api/users', require('./routes/api/users'))


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get("/", (req, res) => {
  res.json({ message: "Welcome to my app" });
});

