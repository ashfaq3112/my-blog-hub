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
    const user = await userModel.findOne({ _id: req.user.id });
    if (!user) return res.redirect("/login");
   

    await user.populate({
      path: "posts",
      populate: { path: "user", select: "name profilepic" },
      options: { sort: { createdAt: -1 } }
    });
    // Calculate analytics
    const totalBlogs = user.posts.length;
    const totalLikes = user.posts.reduce((sum, post) => sum + (post.likes ? post.likes.length : 0), 0);
    let mostPopularBlog = null;
    if (user.posts.length > 0) {
      mostPopularBlog = user.posts.reduce((max, post) =>
        (post.likes && post.likes.length > (max.likes ? max.likes.length : 0)) ? post : max
      , user.posts[0]);
    }

    res.render("profile", { user,totalBlogs, totalLikes, mostPopularBlog , error: null, success: null });
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
router.get("/edit", authenticate, async(req, res) => {
  let user = await userModel.findById(req.user.id);
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

//profile page view
router.get("/:id", authenticate, async (req, res) => {
  try {
    const profileUser = await userModel.findById(req.params.id)
      .populate({
        path: "posts",
        populate: { path: "likes" } // for likes count
      })
      .populate("followers", "name profilepic")
      .populate("following", "name profilepic");

    if (!profileUser) {
      return res.status(404).send("User not found");
    }

    // Logged in user
    const currentUser = await userModel.findById(req.user.id).populate("following");

    // Stats
    const totalBlogs = profileUser.posts.length;
    const totalLikes = profileUser.posts.reduce((acc, post) => acc + post.likes.length, 0);
    const mostPopularBlog = profileUser.posts.sort(
      (a, b) => b.likes.length - a.likes.length
    )[0];

    res.render("publicProfile", {
      profileUser,
      currentUser,
      totalBlogs,
      totalLikes,
      mostPopularBlog
    });
  } catch (err) {
    console.error("❌ Error loading profile:", err);
    res.status(500).send("Server Error");
  }
})
//flow to follow a user
// 📍 Follow / Unfollow
router.post("/follow/:id", authenticate, async (req, res) => {
  try {
    const userToFollow = await userModel.findById(req.params.id);
    const currentUser = await userModel.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let action;

    if (currentUser.following.includes(userToFollow._id)) {
      // ✅ Unfollow
      currentUser.following.pull(userToFollow._id);
      userToFollow.followers.pull(currentUser._id);
      action = "unfollow";
    } else {
      // ✅ Follow
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);
      action = "follow";
    }

    await currentUser.save();
    await userToFollow.save();

    return res.json({
      success: true,
      action,
      followersCount: userToFollow.followers.length,
      followingCount: currentUser.following.length,
      following: currentUser.following.includes(userToFollow._id)
      
    });
  } catch (err) {
    console.error("Error in follow route:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});




module.exports = router;
