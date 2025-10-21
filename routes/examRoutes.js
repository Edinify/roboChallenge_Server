import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  createExam,
  deleteExam,
  getAllExams,
  getExamById,
  updateExam,
} from "../controllers/examController.js";

const router = express.Router();

router.post("/", authMiddleware, createExam);
router.get("/all", authMiddleware, getAllExams);
router.get("/:id", authMiddleware, getExamById);
router.patch("/:id", authMiddleware, updateExam);
router.delete("/:id", authMiddleware, deleteExam);

export default router;
