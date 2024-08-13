const express = require("express");
const router = express.Router();

// Dashboard Page
router.get("/", (req, res) => {
  // Ensure the user is authenticated before accessing the dashboard
  if (req.isAuthenticated()) {
    res.render("dashboard", {
      user: req.user,
    });
  } else {
    req.flash("error_msg", "Please log in to view this resource");
    res.redirect("/users/login");
  }
});

module.exports = router;
