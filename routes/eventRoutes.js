import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  cancelEventChanges,
  confirmEventChanges,
  createEvent,
  createEventNotification,
  deleteEvent,
  getEventsForPagination,
  redirectEventNotification,
  scheduleEvent,
  updateEvent,
} from "../controllers/eventController.js";

const router = express.Router();

router.get("/pagination", authMiddleware, getEventsForPagination);
router.post("/", authMiddleware, createEvent);
router.patch("/:id", authMiddleware, updateEvent);
router.patch("/changes/confirm/:id", authMiddleware, confirmEventChanges);
router.patch("/changes/cancel/:id", authMiddleware, cancelEventChanges);
router.delete("/:id", authMiddleware, deleteEvent);
router.get("/google", redirectEventNotification);
router.get("/google/redirect", createEventNotification);
router.get("/google/schedule", scheduleEvent);

export default router;
