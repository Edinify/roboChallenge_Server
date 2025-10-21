import mongoose from "mongoose";

const Schema = mongoose.Schema;

const studentSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
    },
    birthday: {
      type: Date,
    },
    phone: {
      type: String,
    },
    role: {
      type: String,
      default: "student",
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

studentSchema.index({ createdAt: 1 });

export const Student = mongoose.model("Student", studentSchema);
