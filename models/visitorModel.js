import mongoose from "mongoose";

const Schema = mongoose.Schema;

const visitorSchema = new Schema(
  {
    fullName: {
      type: String,
      require: true,
    },
    email: {
      type: String,
      require: true,
      unique: true,
    },
    password: {
      type: String,
      require: true,
    },
    role: {
      type: String,
      default: "visitor",
    },
    otp: Number,
  },
  { timestamps: true }
);

export const Visitor = mongoose.model("Visitior", visitorSchema);
