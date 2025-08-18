// handles user profile and profile update functionalities

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth");
const upload = require("../config/multer");
const userModel = require("../models/user");

// Profile Page
router.get("/profile", authenticate, async (req, res) => {
  try {
    let user = await userModel.findOne({ email: req.user.email }).populate("posts");
    if (!user) return res.redirect("/login");
    res.render("profile", { user, error: null, success: null });
  } catch (err) {
    console.error("❌ Profile Error:", err);
    res.render("profile", { user: null, error: "Failed to load profile", success: null });
  }
});

// Profile Picture Page
router.get("/profilepicture", authenticate, (req, res) => {
  let user = req.user;
  if (!user) return res.redirect("/login");
  res.render("profilepicture",{user});
});

// Upload Profile Picture
router.post("/upload", authenticate, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.render("profilepicture", { error: "Please select an image", success: null });
    }

    let user = await userModel.findOne({ email: req.user.email });
    user.profilepic = req.file.filename;
    await user.save();

    res.render("profilepicture", { error: null, success: "✅ Profile picture updated" });
  } catch (err) {
    console.error("❌ Upload Error:", err);
    res.render("profilepicture", { error: "Failed to upload profile picture", success: null });
  }
});

module.exports = router;
