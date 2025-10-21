import mongoose from "mongoose";

const Schema = mongoose.Schema;

const studentExamModel = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    version: {
      type: Number,
      required: true,
    },
    courses: [
      {
        type: String,
      },
    ],
    during: {
      type: Number, //minute
      default: 1,
    },
    startedAt: {
      type: Number,
      required: true,
    },
    endedAt: {
      type: Number,
    },
    completedAt: {
      type: Number,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const StudentExam = mongoose.model("StudentExam", studentExamModel);
