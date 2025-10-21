import mongoose from "mongoose";

const Schema = mongoose.Schema;

const studentExamQuestionSchema = new Schema(
  {
    studentExamId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    course: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    type: {
      type: String,
      enum: ["open", "close"],
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
    },
    options: [
      {
        label: {
          type: String,
          enum: ["A", "B", "C", "D", "E", "F", "G"],
        },
        text: {
          type: String,
        },
        image: {
          type: String,
        },
      },
    ],
    correctOptions: [
      {
        type: String,
        enum: ["A", "B", "C", "D", "E", "F", "G"],
      },
    ],
    userAnswer: [
      {
        type: String,
        enum: ["A", "B", "C", "D", "E", "F", "G"],
      },
    ],
    isHesitated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const StudentExamQuestion = mongoose.model(
  "StudentExamQuestion",
  studentExamQuestionSchema
);
