const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    replies: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Profile",
        },
        text: {
          type: String,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

function autoPopulateAuthors(next) {
  this.populate("author", "name avatarUrl");
  this.populate("replies.author", "name avatarUrl");
  next();
}

commentSchema.pre("find", autoPopulateAuthors);
commentSchema.pre("findOne", autoPopulateAuthors);
commentSchema.pre("findById", autoPopulateAuthors);

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
