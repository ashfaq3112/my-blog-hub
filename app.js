require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const { authenticate, isOwner, setUser } = require("./middlewares/auth");

const app = express();
app.use(setUser);

// Models
const postModel = require("./models/post");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// View Engine
app.set("view engine", "ejs");

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Routes
app.use("/", require("./routes/auth"));
app.use("/user", require("./routes/user"));
app.use("/blogs", require("./routes/blogs"));
app.use("/comments", require("./routes/comments"));


// Homepage Route
app.get("/", async (req, res) => {
  try {
   let posts = await postModel
      .find()
      .populate("user", "name profilepic")
      .populate("comments") 
      .lean();

    let user = null;
    if (req.cookies.token) {
      try {
        const jwt = require("jsonwebtoken");
        user = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      } catch (err) {
        user = null; // token invalid or expired
      }
    }
    
    // Calculate trending score: more likes + more comments = higher rank
    posts.forEach(post => {
      post.trendingScore = (post.likes ? post.likes.length : 0) + (post.comments ? post.comments.length : 0);
    });

    // Sort descending by trendingScore
    posts.sort((a, b) => b.trendingScore - a.trendingScore);

    // Take top 5 trending blogs
    const trendingBlogs = posts.slice(0, 5);

    res.render("index", { posts, user,trendingBlogs, error: null, success: null });
  } catch (err) {
    console.error("❌ Homepage Error:", err.message);
    res.render("index", { posts: [], user: null });
  }
});

// app.get("/", async (req, res) => {
//   try {
//     // Fetch all posts with user and comments populated
//     let posts = await postModel
//       .find()
//       .populate("user", "name profilepic")
//       .populate("comments") 
//       .lean(); // use .lean() for faster queries

//     // Calculate trending score: more likes + more comments = higher rank
//     posts.forEach(post => {
//       post.trendingScore = (post.likes ? post.likes.length : 0) + (post.comments ? post.comments.length : 0);
//     });

//     // Sort descending by trendingScore
//     posts.sort((a, b) => b.trendingScore - a.trendingScore);

//     // Take top 5 trending blogs
//     const trendingBlogs = posts.slice(0, 5);

//     res.render("blogs", { posts, trendingBlogs, user: req.user || null,error: null, success: null });
//   } catch (err) {
//     console.error("❌ Homepage Error:", err);
//     res.render("blogs", { posts: [], trendingBlogs: [], user: req.user || null ,error: null, success: null });
//   }
// });



// 404 Handler
app.use((req, res) => {
  res.status(404).render("partials/alerts", {
    error: "Page Not Found",
    success: null,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err.message);
  res.status(500).render("partials/alerts", {
    error: "Internal Server Error",
    success: null,
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
