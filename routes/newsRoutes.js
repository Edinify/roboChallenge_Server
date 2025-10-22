import express from "express";

import { authMiddleware } from "../middleware/auth.js";
import {
  createNews,
  deleteNews,
  getAllNews,
  updateNews,
} from "../controllers/newsController.js";

const router = express.Router();

router.post("/", authMiddleware, createNews);
router.get("/all", authMiddleware, getAllNews);
router.patch("/:id", authMiddleware, updateNews);
router.delete("/:id", authMiddleware, deleteNews);

export default router;
