const express = require("express");
const router = express.Router();
const Comment = require("../models/comment");
const Post = require("../models/post");
const { authenticate } = require("../middlewares/auth");

// Add comment
router.post("/:postId", authenticate, async (req, res) => {
  try {
    const comment = await Comment.create({
      text: req.body.text,
      user: req.user.id,
      post: req.params.postId
    });

    await Post.findByIdAndUpdate(req.params.postId, { $push: { comments: comment._id } });

    const populated = await Comment.findById(comment._id).populate("user", "name profilepic");

    res.json({ success: true, comment: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error adding comment" });
  }
});

// Edit comment
router.post("/edit/:id", authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.json({ success: false });

    if (comment.user.toString() !== req.user.id)
      return res.json({ success: false, message: "Unauthorized" });

    comment.text = req.body.text;
    await comment.save();

    res.json({ success: true, comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// Delete comment
router.post("/delete/:id", authenticate, async (req, res) => {
  try {
    let comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false });

    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false });
    }

    await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } });
    await comment.deleteOne();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting comment" });
  }
});

module.exports = router;
