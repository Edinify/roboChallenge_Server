import mongoose from "mongoose";

const Schema = mongoose.Schema;

const questionSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
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
  },
  {
    timestamps: true,
  }
);

export const Question = mongoose.model("Question", questionSchema);
