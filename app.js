const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const exphbs = require("express-handlebars");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const app = express();
const User = require("./models/User");
const Event = require("./models/Event");
const path = require("path");
const fs = require("fs");

// Load environment variables
require("dotenv").config();

// Passport configuration
require("./config/passport")(passport);

// Route files
const usersRouter = require("./routes/users");
const eventsRouter = require("./routes/events");
const dashboardRouter = require("./routes/dashboard");

// Database connection
const db = process.env.MONGODB_URI;
mongoose
  .connect(db)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Handlebars setup
app.engine(
  "hbs",
  exphbs.engine({
    defaultLayout: "main",
    extname: ".hbs",
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
  })
);
app.set("view engine", "hbs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Configure session
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Your session secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Connect flash
app.use(flash());

// Global variables for flash messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.user || null;
  next();
});

// Middleware to parse request bodies
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(methodOverride("_method"));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Use routes
app.use("/users", usersRouter);
app.use("/events", eventsRouter);
app.use("/dashboard", dashboardRouter);

// Serve static files
app.use(express.static("public"));

// Homepage route
app.get("/", (req, res) => {
  Event.find({})
    .then((events) => {
      res.render("home", { events });
    })
    .catch((err) => {
      console.error("Error fetching events:", err);
      res.status(500).send("Server error");
    });
});

// Start server
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Please use a different port.`
    );
    process.exit(1);
  } else {
    console.error("Server error:", err);
  }
});
