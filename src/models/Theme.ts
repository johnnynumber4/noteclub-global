import mongoose, { Document, Schema } from "mongoose";

export interface ITheme extends Document {
  title: string;
  description: string;

  // Theme timing
  startDate: Date;
  endDate: Date;

  // Theme metadata
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;

  // Guidelines
  guidelines?: string;
  examples?: string[];

  // Theme image
  imageUrl?: string;

  // Statistics
  albumCount: number;
  participantCount: number;

  // Turn management
  currentTurn: number;
  maxTurns?: number;

  createdAt: Date;
  updatedAt: Date;
}

const ThemeSchema = new Schema<ITheme>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // Theme timing
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: ITheme, endDate: Date) {
          return endDate > this.startDate;
        },
        message: "End date must be after start date",
      },
    },

    // Theme metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },

    // Guidelines
    guidelines: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    examples: [
      {
        type: String,
        trim: true,
        maxlength: 200,
      },
    ],

    // Theme image
    imageUrl: {
      type: String,
      trim: true,
    },

    // Statistics
    albumCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    participantCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Turn management
    currentTurn: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxTurns: {
      type: Number,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ThemeSchema.index({ isActive: 1, startDate: -1 });
ThemeSchema.index({ startDate: 1, endDate: 1 });
ThemeSchema.index({ createdBy: 1, createdAt: -1 });

// Virtual for checking if theme is currently active
ThemeSchema.virtual("isCurrentlyActive").get(function () {
  const now = new Date();
  return this.isActive && this.startDate <= now && this.endDate >= now;
});

// Virtual for checking if theme has ended
ThemeSchema.virtual("hasEnded").get(function () {
  return new Date() > this.endDate;
});

// Virtual for checking if theme has started
ThemeSchema.virtual("hasStarted").get(function () {
  return new Date() >= this.startDate;
});

// Virtual for days remaining
ThemeSchema.virtual("daysRemaining").get(function () {
  const now = new Date();
  if (now > this.endDate) return 0;
  const diffTime = this.endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Ensure virtuals are included in JSON
ThemeSchema.set("toJSON", { virtuals: true });

// Text search index
ThemeSchema.index({
  title: "text",
  description: "text",
  guidelines: "text",
});

// Ensure only one active theme at a time
ThemeSchema.index(
  { isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

export default mongoose.models.Theme ||
  mongoose.model<ITheme>("Theme", ThemeSchema);
