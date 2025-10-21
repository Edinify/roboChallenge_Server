import mongoose from "mongoose";

const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    exam: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
    },
  },
  { timestamps: true }
);
export const Order = mongoose.model("Order", orderSchema);
