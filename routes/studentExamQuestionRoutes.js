import express from "express";

import { authMiddleware } from "../middleware/auth.js";

import {
  answerStudentExamQuestion,
  getStudentExamQuestions,
  hesitateStudentExamQuestion,
} from "../controllers/studentExamQuestionController.js";

const router = express.Router();

router.get("/all/:studentExamId", authMiddleware, getStudentExamQuestions);
router.patch("/answer/:id", authMiddleware, answerStudentExamQuestion);
router.patch("/hesitate/:id", authMiddleware, hesitateStudentExamQuestion);

export default router;
