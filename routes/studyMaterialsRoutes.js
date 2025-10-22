import express from "express";

import { authMiddleware } from "../middleware/auth.js";
import {
  createStudyMaterial,
  deleteStudyMaterial,
  getStudyMaterials,
} from "../controllers/studyMaterialsController.js";
import { uploadPdf } from "../config/multer.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  uploadPdf().single("pdf"),
  createStudyMaterial
);
router.get("/all", authMiddleware, getStudyMaterials);
router.delete("/:id", authMiddleware, deleteStudyMaterial);

export default router;
