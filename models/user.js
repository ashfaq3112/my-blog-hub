const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    age: { type: Number },
    role:{type:String, default:"user", enum:["user","admin"]},
    bio: { type: String, default: "This user has no bio yet." },
    profilepic: { type: String, default: "default.webp" },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  },
  { timestamps: true }
);

// ✅ Fix OverwriteModelError
module.exports = mongoose.models.user || mongoose.model("user", userSchema);
