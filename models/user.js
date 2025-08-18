const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    age: { type: Number },
    profilepic: { type: String, default: "default.webp" },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
  },
  { timestamps: true }
);

// ✅ Fix OverwriteModelError
module.exports = mongoose.models.User || mongoose.model("user", userSchema);
