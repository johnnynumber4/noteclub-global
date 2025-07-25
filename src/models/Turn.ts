import mongoose, { Document, Schema } from "mongoose";

export interface ITurn extends Document {
  theme: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  turnNumber: number;

  // Turn status
  isActive: boolean;
  isCompleted: boolean;
  isSkipped: boolean;

  // Timing
  startedAt: Date;
  completedAt?: Date;
  skippedAt?: Date;
  dueDate?: Date;

  // The album posted for this turn (if any)
  album?: mongoose.Types.ObjectId;

  // Skipping info
  skipReason?: string;
  skipRequestedAt?: Date;
  skipApprovedBy?: mongoose.Types.ObjectId;

  // Grace period handling
  gracePeriodExtended: boolean;
  extensionReason?: string;
  extendedUntil?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const TurnSchema = new Schema<ITurn>(
  {
    theme: {
      type: Schema.Types.ObjectId,
      ref: "Theme",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    turnNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    // Turn status
    isActive: {
      type: Boolean,
      default: false,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    isSkipped: {
      type: Boolean,
      default: false,
    },

    // Timing
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    skippedAt: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },

    // The album posted for this turn (if any)
    album: {
      type: Schema.Types.ObjectId,
      ref: "Album",
    },

    // Skipping info
    skipReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    skipRequestedAt: {
      type: Date,
    },
    skipApprovedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Grace period handling
    gracePeriodExtended: {
      type: Boolean,
      default: false,
    },
    extensionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    extendedUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
TurnSchema.index({ theme: 1, turnNumber: 1 });
TurnSchema.index({ user: 1, theme: 1 });
TurnSchema.index({ isActive: 1 });
TurnSchema.index({ theme: 1, isActive: 1 });
TurnSchema.index({ theme: 1, isCompleted: 1, turnNumber: 1 });

// Virtual for checking if turn is overdue
TurnSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate || this.isCompleted || this.isSkipped) return false;
  const now = new Date();
  const effectiveDueDate = this.extendedUntil || this.dueDate;
  return now > effectiveDueDate;
});

// Virtual for days until due
TurnSchema.virtual("daysUntilDue").get(function () {
  if (!this.dueDate || this.isCompleted || this.isSkipped) return null;
  const now = new Date();
  const effectiveDueDate = this.extendedUntil || this.dueDate;
  const diffTime = effectiveDueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for turn status
TurnSchema.virtual("status").get(function () {
  if (this.isCompleted) return "completed";
  if (this.isSkipped) return "skipped";
  if (this.isActive) {
    const now = new Date();
    const effectiveDueDate = this.extendedUntil || this.dueDate;
    if (effectiveDueDate && now > effectiveDueDate) return "overdue";
    return "active";
  }
  return "pending";
});

// Ensure virtuals are included in JSON
TurnSchema.set("toJSON", { virtuals: true });

// Ensure unique turns per theme
TurnSchema.index({ theme: 1, turnNumber: 1 }, { unique: true });

// Ensure only one active turn per theme
TurnSchema.index(
  { theme: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

// Static method to get next turn number for a theme
TurnSchema.statics.getNextTurnNumber = async function (
  themeId: mongoose.Types.ObjectId
) {
  const lastTurn = await this.findOne({ theme: themeId })
    .sort({ turnNumber: -1 })
    .select("turnNumber");

  return lastTurn ? lastTurn.turnNumber + 1 : 1;
};

// Static method to activate next turn
TurnSchema.statics.activateNextTurn = async function (
  themeId: mongoose.Types.ObjectId
) {
  // Deactivate current turn
  await this.updateMany(
    { theme: themeId, isActive: true },
    { isActive: false }
  );

  // Find next pending turn
  const nextTurn = await this.findOne({
    theme: themeId,
    isCompleted: false,
    isSkipped: false,
  }).sort({ turnNumber: 1 });

  if (nextTurn) {
    nextTurn.isActive = true;
    nextTurn.startedAt = new Date();
    await nextTurn.save();
    return nextTurn;
  }

  return null;
};

export default mongoose.models.Turn ||
  mongoose.model<ITurn>("Turn", TurnSchema);
