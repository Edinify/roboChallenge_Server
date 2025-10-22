import mongoose from "mongoose";

const Schema = mongoose.Schema;

const studyMaterialsSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    pdfUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

export const StudyMaterial = mongoose.model(
  "StudyMaterial",
  studyMaterialsSchema
);
