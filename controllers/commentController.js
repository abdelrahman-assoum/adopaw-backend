const Comment = require("../models/Comment");

// Create a new comment on a pet
exports.createComment = async (req, res) => {
  try {
    const { petId, authorId, text } = req.body;

    if (!petId || !authorId || !text) {
      return res
        .status(400)
        .json({ message: "petId, authorId, and text are required." });
    }

    const comment = new Comment({ pet: petId, author: authorId, text });
    const savedComment = await comment.save();

    res.status(201).json(savedComment);
  } catch (err) {
    console.error("Error creating comment:", err);
    res.status(500).json({ message: "Server error while creating comment." });
  }
};

// Get all comments for a pet
exports.getCommentsByPet = async (req, res) => {
  try {
    const { petId } = req.params;

    const comments = await Comment.find({ pet: petId })
      .populate("author", "name avatarUrl") // adjust fields as needed
      .populate("replies.author", "name avatarUrl")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (err) {
    console.error("Error fetching comments:", err);
    res
      .status(500)
      .json({ message: "Server error while retrieving comments." });
  }
};

// Add a reply to a comment
exports.addReply = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { authorId, text } = req.body;

    if (!authorId || !text) {
      return res
        .status(400)
        .json({ message: "authorId and text are required." });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $push: {
          replies: {
            author: authorId,
            text,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    )
      .populate("author", "name avatarUrl")
      .populate("replies.author", "name avatarUrl");

    if (!updatedComment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    res.json(updatedComment);
  } catch (err) {
    console.error("Error adding reply:", err);
    res.status(500).json({ message: "Server error while adding reply." });
  }
};


exports.editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res
        .status(400)
        .json({ message: "Text is required to update comment." });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { text },
      { new: true, runValidators: true }
    );

    if (!updatedComment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    res.json(updatedComment);
  } catch (err) {
    console.error("Error updating comment:", err);
    res.status(500).json({ message: "Server error while updating comment." });
  }
};


exports.editReply = async (req, res) => {
  try {
    const { commentId, replyId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res
        .status(400)
        .json({ message: "Text is required to update reply." });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found." });
    }

    reply.text = text;
    await comment.save();

    res.json(comment);
  } catch (err) {
    console.error("Error updating reply:", err);
    res.status(500).json({ message: "Server error while updating reply." });
  }
};


// Delete Comment by ID
exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
    
        const deletedComment = await Comment.findByIdAndDelete(commentId);
        if (!deletedComment) {
        return res.status(404).json({ message: "Comment not found." });
        }
    
        res.json({ message: "Comment deleted successfully." });
    } catch (err) {
        console.error("Error deleting comment:", err);
        res.status(500).json({ message: "Server error while deleting comment." });
    }
};


// Delete a reply from a comment by reply ID
exports.deleteReply = async (req, res) => {
  try {
    const { commentId, replyId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    // Find reply index by _id
    const replyIndex = comment.replies.findIndex(
      (reply) => reply._id.toString() === replyId
    );

    if (replyIndex === -1) {
      return res.status(404).json({ message: 'Reply not found.' });
    }

    // Remove the reply
    comment.replies.splice(replyIndex, 1);

    await comment.save();

    res.json({ message: 'Reply deleted successfully.', comment });
  } catch (err) {
    console.error('Error deleting reply:', err);
    res.status(500).json({ message: 'Server error while deleting reply.' });
  }
};