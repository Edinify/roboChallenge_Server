import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  createExamVersionQuestions,
  deleteExamVersionQuestion,
  getExamVersionQuestions,
} from "../controllers/examVersionQuestionController.js";

const router = express.Router();

router.post("/:examVersionId", authMiddleware, createExamVersionQuestions);
router.get("/:examVersionId", authMiddleware, getExamVersionQuestions);
router.delete("/:id", authMiddleware, deleteExamVersionQuestion);

export default router;
