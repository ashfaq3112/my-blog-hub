const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  thumbnail: { type: String, default: "default.webp" },
  category: { type: String, default: "General" }, // New field
  tags: [{ type: String }], // New field
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "comment" }],
  author: { type: String, default: "Anonymous" }, // New field
}, 

{ timestamps: true });



// ✅ Fix OverwriteModelError
module.exports = mongoose.models.Post || mongoose.model("post", postSchema);
