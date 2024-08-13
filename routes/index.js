const express = require("express");
const router = express.Router();

// Home Page
router.get("/", (req, res) => {
  res.render("home"); // Ensure you have a `home.hbs` view
});

module.exports = router;
