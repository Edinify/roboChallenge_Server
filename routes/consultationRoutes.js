import express from "express";

import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";
import {
  cancelConsultationChanges,
  confirmConsultationChanges,
  createConsultation,
  deleteConsultation,
  exportConsultationsExcel,
  getConsultationsForPagination,
  updateConsultation,
} from "../controllers/consultationController.js";

const router = express.Router();

router.get("/pagination", authMiddleware, getConsultationsForPagination);
router.get("/excel", authMiddleware, exportConsultationsExcel);
router.post("/", authMiddleware, createConsultation);
router.patch("/:id", authMiddleware, updateConsultation);
router.patch(
  "/changes/confirm/:id",
  authMiddleware,
  confirmConsultationChanges
);
router.patch("/changes/cancel/:id", authMiddleware, cancelConsultationChanges);
router.delete("/:id", authMiddleware, deleteConsultation);

export default router;
