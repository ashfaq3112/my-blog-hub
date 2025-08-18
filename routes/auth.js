const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user");

// Register Page
router.get("/register", (req, res) => res.render("register", { error: null, success: null }));

// Register User
router.post("/register", async (req, res) => {
  try {
    const { username, name, email, password, age } = req.body;
    if (!username || !name || !email || !password) {
      return res.render("register", { error: "All fields are required", success: null });
    }

    let existing = await userModel.findOne({ email });
    if (existing) {
      return res.render("register", { error: "Email already registered", success: null });
    }

    const hash = await bcrypt.hash(password, 10);
    let newUser = await userModel.create({ username, name, email, password: hash, age });

    let token = jwt.sign({ email, id: newUser._id, name }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("token", token);

    res.render("login", { error: null, success: "✅ Registration successful! Please login." });
  } catch (err) {
    console.error("❌ Register Error:", err);
    res.render("register", { error: "Registration failed. Try again.", success: null });
  }
});

// Login Page
router.get("/login", (req, res) => res.render("login", { error: null, success: null }));

// Login User
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.render("login", { error: "Email and password are required", success: null });
    }

    let user = await userModel.findOne({ email });
    if (!user) {
      return res.render("login", { error: "Invalid email or password", success: null });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render("login", { error: "Invalid email or password", success: null });
    }

    let token = jwt.sign({ email, id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("token", token);

    res.redirect("/");
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.render("login", { error: "Login failed, try again.", success: null });
  }
});

// Logout
router.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.render("login", { error: null, success: "✅ Logged out successfully" });
});

module.exports = router;
