const jwt = require("jsonwebtoken");

// ✅ Authentication Middleware
function authenticate(req, res, next) {
  try {
    // If token exists in cookies
    if (req.cookies.token) {
      let data = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      req.user = data; // attach decoded user data
      return next();
    } else {
      return res.render("login", { error: "Please login to continue", success: null });
    }
  } catch (err) {
    console.error("❌ Auth Error:", err.message);
    return res.render("login", { error: "Session expired, please login again", success: null });
  }
}

// ✅ Ownership check (for editing/deleting blogs)
function isOwner(model) {
  return async function (req, res, next) {
    try {
      let doc = await model.findById(req.params.id);
      if (!doc) {
        return res.redirect("/blogs");
      }
      if (doc.user.toString() !== req.user.id) {
        return res.render("blogs", { posts: [], error: "Unauthorized access", success: null });
      }
      next();
    } catch (err) {
      console.error("❌ Ownership Error:", err.message);
      res.redirect("/blogs");
    }
  };
}

// middleware/auth.js
function setUser(req, res, next) {
  res.locals.user = req.user || null; // if logged in, pass user, else null
  next();
}

// Export the middlewares

module.exports = { authenticate, isOwner,setUser };
