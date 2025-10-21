import express from "express";

import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";
import {
  cancelSyllabusChanges,
  confirmSyllabusChanges,
  createSyllabus,
  deleteSyllabus,
  exportSyllabusExcel,
  getSyllabus,
  getSyllabusForPagination,
  updateSyllabus,
} from "../controllers/syllabusController.js";

const router = express.Router();

router.get("/all", authMiddleware, getSyllabus);
router.get("/pagination", authMiddleware, getSyllabusForPagination);
router.get("/excel", authMiddleware, exportSyllabusExcel);
router.post("/", authMiddleware, createSyllabus);
router.patch("/:id", authMiddleware, updateSyllabus);
router.patch("/changes/confirm/:id", authMiddleware, confirmSyllabusChanges);
router.patch("/changes/cancel/:id", authMiddleware, cancelSyllabusChanges);
router.delete("/:id", authMiddleware, deleteSyllabus);

export default router;
