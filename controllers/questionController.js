import { Question } from "../models/questionModel.js";
import fs from "fs";
import path from "path";
import { ExamVersionQuestion } from "../models/examVersionQuestionModel.js";
import { Exam } from "../models/examModel.js";
import { ExamVersion } from "../models/examVersionModel.js";

export const createQuestion = async (req, res) => {
  const { course, text, images, type, difficulty, options, correctOptions } =
    req.body;

  try {
    const newQuestion = new Question({
      course,
      text,
      images,
      type,
      difficulty,
      options,
      correctOptions,
    });

    await newQuestion.save();
    await newQuestion.populate("course");
    res.status(201).json(newQuestion);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getQuestionsForPagination = async (req, res) => {
  const { searchQuery, courseId, length } = req.query;
  const limit = 20;

  try {
    let filterObj = {};

    if (courseId) filterObj.course = courseId;

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");
      filterObj.text = { $regex: regexSearchQuery };
    }

    const totalLength = await Question.countDocuments(filterObj);

    const questions = await Question.find(filterObj)
      .skip(Number(length) || 0)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("course");

    res.status(200).json({ questions, totalLength });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getQuestionsForSelect = async (req, res) => {
  const { examVersionId } = req.params;
  const { searchQuery, courseId, difficulty } = req.query;

  try {
    const examVersion = await ExamVersion.findById({
      _id: examVersionId,
    });

    if (!examVersion) {
      return res.status(404).json({
        key: "exam-version-not-found",
        message: "Exam version not found",
      });
    }

    const exam = await Exam.findById({
      _id: examVersion.examId,
    });

    const coursesIds = exam.courses.map((item) => item.course);

    const examVersionQuestions = await ExamVersionQuestion.find({
      examVersionId,
    });

    const mainQuestionsIds = examVersionQuestions.map(
      (question) => question.mainQuestionId
    );

    let filterObj = {
      _id: { $nin: mainQuestionsIds },
      course: { $in: coursesIds },
    };

    if (courseId) filterObj.course = courseId;

    if (difficulty !== "all") filterObj.difficulty = difficulty;

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");
      filterObj.text = { $regex: regexSearchQuery };
    }

    const totalLength = await Question.countDocuments(filterObj);

    const questions = await Question.find(filterObj)
      .sort({ createdAt: -1 })
      .populate("course");

    res.status(200).json({ questions, totalLength });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const updateQuestion = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedQuestion = await Question.findByIdAndUpdate(id, req.body, {
      new: true,
    }).populate("course");

    if (!updatedQuestion) {
      return res
        .status(404)
        .json({ key: "not-found", message: "Question not found" });
    }

    res.status(200).json(updatedQuestion);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const deleteQuestion = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedQuestion = await Question.findByIdAndDelete(id);

    if (!deletedQuestion) {
      return res
        .status(404)
        .json({ key: "not-found", message: "Question not found" });
    }

    res.status(200).json(deletedQuestion);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const addImageToQuestion = async (req, res) => {
  const { id } = req.params;

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ key: "no-file", message: "No file uploaded" });
    }

    const imagePath = `/uploads/images/${req.file.filename}`;

    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      { $push: { images: imagePath } },
      { new: true }
    ).populate("course");

    if (!updatedQuestion) {
      return res
        .status(404)
        .json({ key: "not-found", message: "Question not found" });
    }

    res.status(200).json(updatedQuestion);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const deleteImageFromQuestion = async (req, res) => {
  const { id } = req.params;
  const { imagePath } = req.body;

  try {
    const question = await Question.findById(id);
    if (!question) {
      return res
        .status(404)
        .json({ key: "not-found", message: "Question not found" });
    }

    if (!question.images.includes(imagePath)) {
      return res.status(400).json({
        key: "image-not-found",
        message: "Image not found in question",
      });
    }

    question.images = question.images.filter((img) => img !== imagePath);
    await question.save();
    await question.populate("course");

    const fullPath = path.join(process.cwd(), imagePath);
    fs.unlink(fullPath, (err) => {
      if (err) {
        console.error("Image file deletion error:", err.message);
      }
    });

    res.status(200).json(question);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const addImageToOption = async (req, res) => {
  const { id, label } = req.params;

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ key: "no-file", message: "No file uploaded" });
    }

    const imagePath = `/uploads/images/${req.file.filename}`;

    const question = await Question.findById(id);

    if (!question) {
      return res
        .status(404)
        .json({ key: "question-not-found", message: "Question not found" });
    }

    const targetOption = question.options.find(
      (option) => option.label === label
    );

    if (!targetOption) {
      return res
        .status(404)
        .json({ key: "option-not-found", message: "Option not found" });
    }

    targetOption.image = imagePath;

    await question.save();
    await question.populate("course");

    res.status(200).json(question);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const deleteImageFromOption = async (req, res) => {
  const { id, label } = req.params;
  const { imagePath } = req.body;

  try {
    const question = await Question.findById(id);
    if (!question) {
      return res
        .status(404)
        .json({ key: "not-found", message: "Question not found" });
    }

    const targetOption = question.options.find(
      (option) => option.label === label
    );

    if (!targetOption) {
      return res
        .status(404)
        .json({ key: "option-not-found", message: "Option not found" });
    }

    targetOption.image = "";
    await question.save();
    await question.populate("course");

    const fullPath = path.join(process.cwd(), imagePath);
    fs.unlink(fullPath, (err) => {
      if (err) {
        console.error("Image file deletion error:", err.message);
      }
    });

    res.status(200).json(question);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
