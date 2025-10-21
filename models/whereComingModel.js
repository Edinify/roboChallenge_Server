import mongoose from "mongoose";

const Schema = mongoose.Schema;

const whereComingSchema = new Schema(
  {
    name: {
      type: String,
      require: true,
      unique: true,
    },
    desc: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const WhereComing = mongoose.model("WhereComing", whereComingSchema);
