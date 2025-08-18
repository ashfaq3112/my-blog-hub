require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const app = express();

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
    const posts = await postModel
      .find()
      .populate("user")
      .sort({ createdAt: -1 })
      .limit(5);

    let user = null;
    if (req.cookies.token) {
      try {
        const jwt = require("jsonwebtoken");
        user = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      } catch (err) {
        user = null; // token invalid or expired
      }
    }

    res.render("index", { posts, user });
  } catch (err) {
    console.error("❌ Homepage Error:", err.message);
    res.render("index", { posts: [], user: null });
  }
});

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
