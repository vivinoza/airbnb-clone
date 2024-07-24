const express = require("express");
const cors = require("cors");
const { default: mongoose } = require("mongoose");
const User = require("./models/Users");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();

const salt = bcrypt.genSaltSync(10);

const jwtSecret = "sfnsdfnnnjksk234bnfwrue4234yif";

app.use(express.json());

app.use(cookieParser());

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:5173",
  })
);

mongoose.connect(process.env.MONGO_URL);

app.get("/test", (req, res) => {
  res.json("test ok");
});

app.post("/regsiter", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, salt),
    });

    res.json(userDoc);
  } catch (e) {
    res.status(400).json({ message: "User already exists" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const userDoc = await User.findOne({ email });
  if (userDoc) {
    const isMatch = bcrypt.compareSync(password, userDoc.password);
    if (isMatch) {
      jwt.sign(
        { email: userDoc.email, id: userDoc._id },
        jwtSecret,
        {},
        (err, token) => {
          if (err) throw err;
          res.cookie("token", token).json(userDoc);
        }
      );
    } else {
      res.status(400).json({ message: "Wrong password" });
    }
  } else {
    res.status(400).json({ message: "User does not exist" });
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, async (err, decoded) => {
      if (err) throw err;
      const { name, email, _id } = await User.findById(decoded.id);
      res.json({ name, email, _id });
    });
  } else {
    res.status(400).json({ message: "You are not logged in" });
  }
});

app.listen(4000);
