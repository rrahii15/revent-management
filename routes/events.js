const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const multer = require("multer");
const path = require("path");
const cloudinary = require("../config/cloudinary");
const Event = require("../models/Event");

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads")); // Correct path to uploads directory
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

// Route to display all events
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id }).lean();
    res.render("events/index", { events });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Route to show the form to add a new event
router.get("/new", ensureAuthenticated, (req, res) => {
  res.render("events/new");
});

// Route to handle the creation of a new event
router.post(
  "/",
  ensureAuthenticated,
  upload.single("image"),
  async (req, res) => {
    const { title, description, date } = req.body;
    let imageUrl = "";

    try {
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path);
        imageUrl = result.secure_url;
      }

      const newEvent = new Event({
        title,
        description,
        date,
        image: imageUrl,
        createdBy: req.user._id,
      });

      await newEvent.save();
      req.flash("success_msg", "Event added successfully");
      res.redirect("/events");
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  }
);

// Route to show the form to edit an event
router.get("/:id/edit", ensureAuthenticated, async (req, res) => {
  try {
    // Fetch the event from the database
    const event = await Event.findById(req.params.id).lean();

    // Log for debugging
    console.log("User ID:", req.user._id);
    console.log("Event Created By:", event.createdBy);

    if (!event) {
      return res.status(404).send("Event not found");
    }

    // Check if the authenticated user is the owner of the event
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(401).send("Unauthorized");
    }

    // Render the edit form if authorized
    res.render("events/edit", { event });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Route to handle the update of an event
router.put(
  "/:id",
  ensureAuthenticated,
  upload.single("image"),
  async (req, res) => {
    const { title, description, date } = req.body;
    let imageUrl = "";

    try {
      let event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).send("Event not found");
      }

      if (event.createdBy.toString() !== req.user._id.toString()) {
        return res.status(401).send("Unauthorized");
      }

      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path);
        imageUrl = result.secure_url;
      }

      event = await Event.findByIdAndUpdate(
        req.params.id,
        {
          title,
          description,
          date,
          image: imageUrl || event.image,
        },
        { new: true, runValidators: true }
      );

      req.flash("success_msg", "Event updated successfully");
      res.redirect("/events");
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  }
);

// Route to handle the deletion of an event
router.delete("/:id", ensureAuthenticated, async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).send("Event not found");
    }

    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(401).send("Unauthorized");
    }

    await Event.findByIdAndDelete(req.params.id);
    req.flash("success_msg", "Event deleted successfully");
    res.redirect("/events");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
