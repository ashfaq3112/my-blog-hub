// handles user profile and profile update functionalities

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth");
const upload = require("../config/multer");
const userModel = require("../models/user");

// router.use(express.urlencoded({ extended: true }));
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

// Update Profile Page
router.get("/edit", authenticate, (req, res) => {
  let user = req.user;
  if (!user) return res.redirect("/login");
  res.render("editprofile", { user, error: null, success: null });
});

// Update Profile
router.post("/editprofile", authenticate, upload.single("profilepic"), async (req, res) => {
  try {
    const { name, username, email, bio } = req.body;

    if (!name || !username || !email) {
      return res.render("editprofile", { user: req.user, error: "Name, username, and email are required", success: null });
    }

    // Find the current user
    const user = await userModel.findById(req.user.id);
    if (!user) return res.redirect("/login");

    // Update fields
    user.name = name;
    user.username = username;
    user.email = email;
    user.bio = bio || "";

    // Update profile picture if uploaded
    if (req.file) {
      user.profilepic = req.file.filename;
    }

    await user.save();

    res.render("editprofile", { user, error: null, success: "✅ Profile updated successfully" });
  } catch (err) {
    console.error("❌ Edit Profile Error:", err);
    res.render("editprofile", { user: req.user, error: "Failed to update profile", success: null });
  }
});


module.exports = router;
