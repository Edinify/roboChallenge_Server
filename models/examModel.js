import mongoose from "mongoose";

const Schema = mongoose.Schema;

const examSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      enum: ["az", "en", "tr", "ru"],
    },
    date: {
      type: Date,
      required: true,
    },
    during: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Exam = mongoose.model("Exam", examSchema);
