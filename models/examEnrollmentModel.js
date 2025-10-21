import mongoose from "mongoose";

const Schema = mongoose.Schema;

const examEnrollmentSchema = new Schema(
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
    purchasedAt: {
      type: Date,
      required: true,
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["valid", "invalid"],
    },
  },
  { timestamps: true }
);

export const ExamEnrollment = mongoose.model(
  "ExamEnrollment",
  examEnrollmentSchema
);
