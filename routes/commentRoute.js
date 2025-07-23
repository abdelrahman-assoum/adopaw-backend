const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");

// Create a new comment for a pet
router.post("/", commentController.createComment);

// Get comments for a specific pet
router.get("/:petId", commentController.getCommentsByPet);

// Add a reply to a comment
router.post("/reply/:commentId", commentController.addReply);

// Edit a comment
router.put("/:commentId", commentController.editComment);

// Edit a reply to a comment
router.put("/:commentId/reply/:replyId", commentController.editReply);

// Delete a comment
router.delete("/:commentId", commentController.deleteComment);

// Delete a reply from a comment
router.delete("/:commentId/reply/:replyId", commentController.deleteReply);

module.exports = router;
