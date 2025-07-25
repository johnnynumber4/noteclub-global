import mongoose, { Document, Schema } from "mongoose";

export interface IComment extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  album: mongoose.Types.ObjectId;

  // Threading support
  parentComment?: mongoose.Types.ObjectId;
  replies: mongoose.Types.ObjectId[];
  depth: number;

  // Engagement
  likes: mongoose.Types.ObjectId[];

  // Moderation
  isHidden: boolean;
  isEdited: boolean;
  editedAt?: Date;
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;
  moderationReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
      minlength: 1,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    album: {
      type: Schema.Types.ObjectId,
      ref: "Album",
      required: true,
    },

    // Threading support
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    replies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    depth: {
      type: Number,
      default: 0,
      min: 0,
      max: 5, // Limit nesting depth to prevent infinite recursion
    },

    // Engagement
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Moderation
    isHidden: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    moderatedAt: {
      type: Date,
    },
    moderationReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
CommentSchema.index({ album: 1, createdAt: -1 });
CommentSchema.index({ author: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1, createdAt: 1 });
CommentSchema.index({ album: 1, parentComment: 1, createdAt: 1 });

// Virtual for like count
CommentSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

// Virtual for reply count
CommentSchema.virtual("replyCount").get(function () {
  return this.replies.length;
});

// Virtual for checking if comment is a top-level comment
CommentSchema.virtual("isTopLevel").get(function () {
  return !this.parentComment;
});

// Ensure virtuals are included in JSON
CommentSchema.set("toJSON", { virtuals: true });

// Pre-save middleware to update parent comment's replies array
CommentSchema.pre("save", async function (next) {
  if (this.isNew && this.parentComment) {
    // Add this comment to parent's replies array
    await mongoose
      .model("Comment")
      .findByIdAndUpdate(this.parentComment, {
        $addToSet: { replies: this._id },
      });

    // Set depth based on parent
    const parentComment = await mongoose
      .model("Comment")
      .findById(this.parentComment);
    if (parentComment) {
      this.depth = Math.min(parentComment.depth + 1, 5);
    }
  }
  next();
});

// Pre-remove middleware to clean up references
CommentSchema.pre("findOneAndDelete", async function (next) {
  const comment = await this.model.findOne(this.getQuery());
  if (comment) {
    // Remove from parent's replies array
    if (comment.parentComment) {
      await mongoose
        .model("Comment")
        .findByIdAndUpdate(comment.parentComment, {
          $pull: { replies: comment._id },
        });
    }

    // Remove from album's comments array
    await mongoose
      .model("Album")
      .findByIdAndUpdate(comment.album, { $pull: { comments: comment._id } });

    // Delete all replies recursively
    await mongoose.model("Comment").deleteMany({ parentComment: comment._id });
  }
  next();
});

export default mongoose.models.Comment ||
  mongoose.model<IComment>("Comment", CommentSchema);
