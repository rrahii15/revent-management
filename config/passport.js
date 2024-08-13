const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const User = require("../models/User");

module.exports = function (passport) {
  // Configure Local Strategy
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await User.findOne({ email: email });
          if (!user) {
            return done(null, false, {
              message: "That email is not registered",
            });
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Password incorrect" });
          }
        } catch (err) {
          console.error("Error during authentication:", err);
          return done(err);
        }
      }
    )
  );

  // Serialize User
  passport.serializeUser((user, done) => {
    try {
      done(null, user.id);
    } catch (error) {
      console.error("Serialization error:", error);
      done(error);
    }
  });

  // Deserialize User
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      if (!user) {
        return done(new Error("User not found"));
      }
      done(null, user);
    } catch (error) {
      console.error("Deserialization error:", error);
      done(error);
    }
  });
};
