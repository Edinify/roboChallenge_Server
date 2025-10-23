import { Student } from "../models/studentModel.js";
import bcrypt from "bcrypt";
import { Admin } from "../models/adminModel.js";
import { getCurrentUser } from "./userController.js";
import { News } from "../models/newsModel.js";

// Create news
export const createNews = async (req, res) => {
  try {
    const newNews = new News(req.body);
    newNews.save();

    res.status(201).json(newNews);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get all news
export const getAllNews = async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });

    res.status(200).json(news);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Update news
export const updateNews = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedNews = await News.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedNews) {
      return res.status(404).json({ key: "news-not-found" });
    }

    res.status(200).json(updatedNews);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete news
export const deleteNews = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedNews = await News.findByIdAndDelete(id);

    if (!deletedNews) {
      return res.status(404).json({ key: "news-not-found" });
    }

    res.status(200).json(deletedNews);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
