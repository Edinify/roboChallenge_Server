import mongoose from "mongoose";

const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    title: {
      type: String,
      enum: ["event", "updates"],
    },
    type: {
      type: String,
      enum: [
        "created-event",
        "sent-updates-to-confirm",
        "update-directly",
        "confirmed-or-cancelled-updates",
        "delete",
      ],
    },
    history: {
      type: Schema.Types.ObjectId,
      ref: "History",
    },
    category: {
      type: String,
      enum: ["tuition-fee", "student", "event", "group", "other"],
      default: "other",
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
    recipient: {
      type: Schema.Types.ObjectId,
    },
    isView: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
