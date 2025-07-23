const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const authenticate = require("../middlewares/supabaseAuth");

// Create a new comment for a pet
router.post("/", authenticate, commentController.createComment);

// Get comments for a specific pet
router.get("/:petId", authenticate, commentController.getCommentsByPet);

// Add a reply to a comment
router.post("/reply/:commentId", authenticate, commentController.addReply);

// Edit a comment
router.put("/:commentId", authenticate, commentController.editComment);

// Edit a reply to a comment
router.put("/:commentId/reply/:replyId", authenticate, commentController.editReply);

// Delete a comment
router.delete("/:commentId", authenticate, commentController.deleteComment);

// Delete a reply from a comment
router.delete("/:commentId/reply/:replyId", authenticate, commentController.deleteReply);

module.exports = router;
