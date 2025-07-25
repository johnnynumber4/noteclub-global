import mongoose, { Document, Schema } from "mongoose";

export interface IAlbum extends Document {
  title: string;
  artist: string;
  year?: number;
  genre?: string;
  description?: string;

  // Theme and posting info
  theme: mongoose.Types.ObjectId;
  postedBy: mongoose.Types.ObjectId;
  postedAt: Date;

  // Streaming links
  spotifyUrl?: string;
  youtubeMusicUrl?: string;
  appleMusicUrl?: string;
  tidalUrl?: string;
  deezerUrl?: string;

  // Album artwork
  coverImageUrl?: string;

  // Wikipedia info
  wikipediaUrl?: string;
  wikipediaDescription?: string;

  // Album metadata
  trackCount?: number;
  duration?: number; // in seconds
  label?: string;

  // Engagement
  likes: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];

  // Moderation
  isApproved: boolean;
  isHidden: boolean;
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;

  // Turn tracking
  turnNumber: number;

  createdAt: Date;
  updatedAt: Date;
}

const AlbumSchema = new Schema<IAlbum>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    artist: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    year: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    genre: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    // Theme and posting info
    theme: {
      type: Schema.Types.ObjectId,
      ref: "Theme",
      required: true,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postedAt: {
      type: Date,
      default: Date.now,
    },

    // Streaming links
    spotifyUrl: {
      type: String,
      trim: true,
      match: /^https:\/\/(open\.)?spotify\.com\//,
    },
    youtubeMusicUrl: {
      type: String,
      trim: true,
      match: /^https:\/\/music\.youtube\.com\//,
    },
    appleMusicUrl: {
      type: String,
      trim: true,
      match: /^https:\/\/music\.apple\.com\//,
    },
    tidalUrl: {
      type: String,
      trim: true,
      match: /^https:\/\/tidal\.com\//,
    },
    deezerUrl: {
      type: String,
      trim: true,
      match: /^https:\/\/www\.deezer\.com\//,
    },

    // Album artwork
    coverImageUrl: {
      type: String,
      trim: true,
    },

    // Wikipedia info
    wikipediaUrl: {
      type: String,
      trim: true,
      match: /^https:\/\/[a-z]{2,3}\.wikipedia\.org\//,
    },
    wikipediaDescription: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    // Album metadata
    trackCount: {
      type: Number,
      min: 1,
      max: 200,
    },
    duration: {
      type: Number,
      min: 1,
    },
    label: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    // Engagement
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],

    // Moderation
    isApproved: {
      type: Boolean,
      default: true,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    moderatedAt: {
      type: Date,
    },

    // Turn tracking
    turnNumber: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
AlbumSchema.index({ theme: 1, turnNumber: 1 });
AlbumSchema.index({ postedBy: 1, postedAt: -1 });
AlbumSchema.index({ artist: 1, title: 1 });
AlbumSchema.index({ postedAt: -1 });
AlbumSchema.index({ isApproved: 1, isHidden: 1 });

// Virtual for like count
AlbumSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

// Virtual for comment count
AlbumSchema.virtual("commentCount").get(function () {
  return this.comments.length;
});

// Ensure virtuals are included in JSON
AlbumSchema.set("toJSON", { virtuals: true });

// Prevent duplicate album submissions for the same theme by the same user
AlbumSchema.index({ theme: 1, postedBy: 1 }, { unique: true });

// Text search index
AlbumSchema.index({
  title: "text",
  artist: "text",
  description: "text",
  genre: "text",
});

export default mongoose.models.Album ||
  mongoose.model<IAlbum>("Album", AlbumSchema);
