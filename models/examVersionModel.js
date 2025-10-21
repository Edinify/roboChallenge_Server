import mongoose from "mongoose";

const Schema = mongoose.Schema;

const examVersionSchema = new Schema(
  {
    examId: {
      type: Schema.Types.ObjectId,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

export const ExamVersion = mongoose.model("ExamVersion", examVersionSchema);
