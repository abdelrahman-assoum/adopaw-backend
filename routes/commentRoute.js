const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const { verifySupabaseToken } = require("../middlewares/supabaseAuth");

// Create a new comment for a pet
router.post("/", verifySupabaseToken, commentController.createComment);

// Get comments for a specific pet
router.get("/:petId", verifySupabaseToken, commentController.getCommentsByPet);

// Add a reply to a comment
router.post("/reply/:commentId", verifySupabaseToken, commentController.addReply);

// Edit a comment
router.put("/:commentId", verifySupabaseToken, commentController.editComment);

// Edit a reply to a comment
router.put("/:commentId/reply/:replyId", verifySupabaseToken, commentController.editReply);

// Delete a comment
router.delete("/:commentId", verifySupabaseToken, commentController.deleteComment);

// Delete a reply from a comment
router.delete("/:commentId/reply/:replyId", verifySupabaseToken, commentController.deleteReply);

module.exports = router;
