import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  addImageToOption,
  addImageToQuestion,
  createQuestion,
  deleteImageFromOption,
  deleteImageFromQuestion,
  deleteQuestion,
  getQuestionsForPagination,
  getQuestionsForSelect,
  updateQuestion,
} from "../controllers/questionController.js";
import { uploadImage } from "../config/multer.js";


// 

const router = express.Router();

router.post("/", authMiddleware, createQuestion);
router.post(
  "/:id/add-question-image",
  uploadImage().single("image"),
  addImageToQuestion
);
router.post(
  "/:id/add-option-image/:label",
  uploadImage().single("image"),
  addImageToOption
);
router.get("/pagination", authMiddleware, getQuestionsForPagination);
router.get("/for-select/:examVersionId", authMiddleware, getQuestionsForSelect);
router.patch("/:id", authMiddleware, updateQuestion);
router.delete("/:id", authMiddleware, deleteQuestion);
router.delete(
  "/:id/delete-question-image",
  authMiddleware,
  deleteImageFromQuestion
);
router.delete(
  "/:id/delete-option-image/:label",
  authMiddleware,
  deleteImageFromOption
);

export default router;
