const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const supabaseAuth = require("../middlewares/supabaseAuth");

// Create a new comment for a pet
router.post("/", supabaseAuth, commentController.createComment);

// Get comments for a specific pet
router.get("/:petId", supabaseAuth, commentController.getCommentsByPet);

// Add a reply to a comment
router.post("/reply/:commentId", supabaseAuth, commentController.addReply);

// Edit a comment
router.put("/:commentId", supabaseAuth, commentController.editComment);

// Edit a reply to a comment
router.put("/:commentId/reply/:replyId", supabaseAuth, commentController.editReply);

// Delete a comment
router.delete("/:commentId", supabaseAuth, commentController.deleteComment);

// Delete a reply from a comment
router.delete("/:commentId/reply/:replyId", supabaseAuth, commentController.deleteReply);

module.exports = router;
