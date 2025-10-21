import mongoose from "mongoose";

const Schema = mongoose.Schema;

const historySchema = new Schema(
  {
    sender: {
      type: Object,
    },
    recipient: {
      type: Object,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    action: {
      type: String,
      enum: ["create", "update", "delete"],
    },
    modelName: {
      type: String,
      required: true,
    },
    oldData: {
      type: Object,
    },
    newData: {
      type: Object,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const History = mongoose.model("History", historySchema);
