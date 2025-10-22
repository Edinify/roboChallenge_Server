import mongoose from "mongoose";

const Schema = mongoose.Schema;

const newsSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

newsSchema.index({ createdAt: 1 });

export const News = mongoose.model("News", newsSchema);
