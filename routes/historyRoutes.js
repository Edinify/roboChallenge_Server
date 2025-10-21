import express from "express";
import {
  getHistory,
  updateStudentHistoryStatus,
} from "../controllers/historyController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

// GET
router.get("/by-docmunet-id/:documentId", getHistory);

// PATCH
// router.patch("/student/:historyId", updateStudentHistoryStatus);

export default router;
