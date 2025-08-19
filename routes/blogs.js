// handles blog creation, editing, and viewing functionalities

const express = require("express");
const router = express.Router();
const postModel = require("../models/post");
const userModel = require("../models/user");
const { authenticate } = require("../middlewares/auth");
const upload = require("../config/multer");
const { isOwner } = require("../middlewares/auth");

// Blog Listing
router.get("/", authenticate,async (req, res) => {
  try {
    // Fetch all posts with user and comments populated
    let posts = await postModel
      .find()
      .populate("user", "name profilepic")
      .populate("comments") 
      .lean(); // use .lean() for faster queries

    // Calculate trending score: more likes + more comments = higher rank
    posts.forEach(post => {
      post.trendingScore = (post.likes ? post.likes.length : 0) + (post.comments ? post.comments.length : 0);
    });

    // Sort descending by trendingScore
    posts.sort((a, b) => b.trendingScore - a.trendingScore);

    // Take top 5 trending blogs
    const trendingBlogs = posts.slice(0, 5);

    res.render("blogs", { posts, trendingBlogs, user: req.user || null,error: null, success: null });
  } catch (err) {
    console.error("❌ Homepage Error:", err);
    res.render("blogs", { posts: [], trendingBlogs: [], user: req.user || null ,error: null, success: null });
  }
});



// Create Blog Form
router.get("/create", authenticate, (req, res) => {
  res.render("createBlog",{user:req.user,error: null, success: null });
});

// Create Blog
router.post("/create", authenticate, upload.single("thumbnail"), async (req, res) => {
  try {
    const { title, content, tags, category } = req.body;
    if (!title || !content) {
      return res.render("createBlog", { error: "Title and content are required", success: null });
    }

    let user = await userModel.findOne({ email: req.user.email });
    if (!user) return res.render("createBlog", { error: "User not found", success: null });

    let post = await postModel.create({
      user: user._id,
      title,
      content,
      thumbnail: req.file ? req.file.filename : "default.webp",
      category:category || "General",
      tags: tags ? tags.split(",").map(t => t.trim()) : []
    });

    user.posts.push(post._id);
    await user.save();

    res.render("createBlog", { error: null, success: "✅ Blog created successfully" });
  } catch (err) {
    console.error("❌ Blog Create Error:", err);
    res.render("createBlog", { error: "Failed to create blog", success: null });
  }
});


// blogs by category
router.get("/category/:category", async (req, res) => {
  try {
    const posts = await postModel.find({ category: req.params.category }).populate("user").sort({ createdAt: -1 });
    // console.log("Posts by category:", posts);
    res.render("blogs", { posts, error: null, success: null });
  } catch (err) {
    console.error("❌ Category Blogs Error:", err);
    res.render("blogs", { posts: [], error: "Failed to load blogs for this category", success: null });
  }
});

// Search Blogs
// Search blogs by category, title, or tags
router.get("/search", async (req, res) => {
  try {
    const query = req.query.query;

    // Search in category, title, or tags (case-insensitive)
    const posts = await postModel.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } }
      ]
    })
    .populate("user")
    .sort({ createdAt: -1 });

    res.render("blogs", { posts, error: null, success: `Search results for "${query}"` });
  } catch (err) {
    console.error("❌ Search Error:", err);
    res.redirect("/blogs");
  }
});


// Blog Details
router.get("/:id",authenticate, async (req, res, next) => {
  try {
    const post = await postModel
      .findById(req.params.id)
      .populate("user")
      .populate({
        path: "comments",
        populate: { path: "user", select: "name profilepic following followers" }
      });

    if (!post) return res.status(404).send("Post not found");

    // ✅ Sort comments by newest first
    post.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const user = await userModel.findById(req.user.id).populate("following");

    res.render("blogDetails", { post, user : user|| null, error: null, success: null });
  } catch (err) {
    next(err);
  }
});


// Show Edit Blog Page
router.get("/edit/:id", authenticate,isOwner(postModel), async (req, res) => {
  try {
    let post = await postModel.findById(req.params.id);
    if (!post) return res.redirect("/blogs");
    res.render("edit", { post, error: null, success: null });
  } catch (err) {
    console.error("❌ Edit Page Error:", err);
    res.redirect("/blogs");
  }
});

// Update Blog
router.post("/update/:id", authenticate, upload.single("thumbnail"), async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    if (!title || !content) {
      let post = await postModel.findById(req.params.id);
      return res.render("edit", { post, error: "Title and content are required", success: null });
    }

    let updatedData = {
      title,
      content,
      tags: tags ? tags.split(",").map(t => t.trim()) : []
    };

    if (req.file) {
      updatedData.thumbnail = req.file.filename; // update thumbnail if uploaded
    }

    await postModel.findByIdAndUpdate(req.params.id, updatedData);
    res.redirect("/blogs/" + req.params.id);
  } catch (err) {
    console.error("❌ Update Blog Error:", err);
    let post = await postModel.findById(req.params.id);
    res.render("edit", { post, error: "Failed to update blog", success: null });
  }
});


// Delete Blog
router.get("/delete/:id", authenticate,isOwner(postModel), async (req, res) => {
  try {
    await postModel.findByIdAndDelete(req.params.id);
    res.redirect("/user/profile");
  } catch (err) {
    console.error("❌ Delete Error:", err);
    res.redirect("/profile");
  }
});

// Like / Unlike
router.post("/like/:id", authenticate, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const index = post.likes.indexOf(req.user.id);
    if (index === -1) {
      post.likes.push(req.user.id);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    res.json({ success: true, likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error liking post" });
  }
});

//profile page view
router.get("/p/:email", async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.params.email })
    if (!user) return res.status(404).send("User not found");

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

    res.render("publicProfile", { user, totalBlogs, totalLikes, mostPopularBlog });
  } catch (err) {
    console.error("❌ Public Profile Error:", err);
    res.redirect("/blogs");
  }
});



module.exports = router;
