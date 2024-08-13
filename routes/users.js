const express = require("express");
const router = express.Router();
const passport = require("passport");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Event = require("../models/Event"); // Adjust the path as needed

// Login Page
router.get("/login", (req, res) => res.render("login"));

// Register Page
router.get("/register", (req, res) => res.render("register"));

// Register route
router.post("/register", async (req, res) => {
  const { name, username, email, password, password2 } = req.body;
  let errors = [];

  // Validation
  if (!name || !username || !email || !password || !password2) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (password !== password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  if (password.length < 6) {
    errors.push({ msg: "Password must be at least 6 characters" });
  }

  if (errors.length > 0) {
    return res.render("register", {
      errors,
      name,
      username,
      email,
      password,
      password2,
    });
  }

  try {
    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      errors.push({ msg: "Email or username already exists" });
      return res.render("register", {
        errors,
        username,
        email,
        password,
        password2,
      });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password,
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(newUser.password, salt);

    // Save user to database
    await newUser.save();
    req.flash("success_msg", "You are now registered and can log in");
    res.redirect("/users/login");
  } catch (err) {
    console.error("Error occurred during registration:", err);
    res.status(500).send("Server error");
  }
});

// Login route
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true,
  })(req, res, next);
});

// Logout route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).send("Server error");
    }
    req.flash("success_msg", "You are logged out");
    res.redirect("/users/login");
  });
});
// dashboard route
router.get("/dashboard", (req, res) => {
  if (req.isAuthenticated()) {
    console.log("Authenticated user:", req.user); // Check this in your console

    Event.find({ userId: req.user._id })
      .then((events) => {
        res.render("dashboard", {
          user: req.user,
          events: events,
        });
      })
      .catch((err) => {
        console.error("Error fetching events:", err);
        res.redirect("/error");
      });
  } else {
    res.redirect("/users/login");
  }
});

module.exports = router;
