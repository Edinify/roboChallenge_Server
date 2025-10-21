import express from "express";
import {
  createRoom,
  deleteRoom,
  getRooms,
  getRoomsForPagination,
  updateRoom,
} from "../controllers/roomController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createRoom);
router.get("/pagination", authMiddleware, getRoomsForPagination);
router.get("/", authMiddleware, getRooms);
router.patch("/:id", authMiddleware, updateRoom);
router.delete("/:id", authMiddleware, deleteRoom);

export default router;
