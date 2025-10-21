import express from "express";
import {
  authMiddleware,
  checkAdminAndSuperAdmin,
  checkTeacher,
} from "../middleware/auth.js";
import {
  cancelChanges,
  confirmChanges,
  createWorker,
  deleteWorker,
  getWorkers,
  updateWorker,
  updateWorkerOwnPassword,
} from "../controllers/wokerController.js";

const router = express.Router();

router.post("/create", authMiddleware, createWorker);
router.get("/", authMiddleware, getWorkers);
router.patch("/:id", authMiddleware, updateWorker);
router.delete("/:id", authMiddleware, deleteWorker);
router.patch("/own/password", authMiddleware, updateWorkerOwnPassword);
router.patch("/changes/confirm", authMiddleware, confirmChanges);
router.patch("/changes/cancel", authMiddleware, cancelChanges);

export default router;
