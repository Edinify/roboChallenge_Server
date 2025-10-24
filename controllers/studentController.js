import fs from "fs/promises";
import Docxtemplater from "docxtemplater";
import path from "path";
import PizZip from "pizzip";
import { Lesson } from "../models/lessonModel.js";
import { Student } from "../models/studentModel.js";
import { Group } from "../models/groupModel.js";
import { Course } from "../models/courseModel.js";
import { Worker } from "../models/workerModel.js";
import { Teacher } from "../models/teacherModel.js";
import mongoose from "mongoose";
import moment from "moment-timezone";
import exceljs from "exceljs";
import bcrypt from "bcrypt";
import { Admin } from "../models/adminModel.js";
import { getCurrentUser } from "./userController.js";
import getLogger from "../config/logger.js";
import { History } from "../models/historyModel.js";
import { createHistoryNotifications } from "./notificationController.js";

// Get students
export const getStudents = async (req, res) => {
  const { studentsCount, searchQuery } = req.query;

  try {
    const regexSearchQuery = new RegExp(searchQuery?.trim() || "", "i");

    const students = await Student.find({
      fullName: { $regex: regexSearchQuery },
    })
      .select("-password")
      .skip(parseInt(studentsCount || 0))
      .limit(parseInt(studentsCount || 0) + 30);

    const totalLength = await Student.countDocuments({
      fullName: { $regex: regexSearchQuery },
    });

    res.status(200).json({ students, totalLength });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get active students
export const getActiveStudents = async (req, res) => {
  const { studentsCount, searchQuery, courseId } = req.query;
  try {
    const regexSearchQuery = new RegExp(searchQuery?.trim() || "", "i");

    const students = await Student.find({
      fullName: { $regex: regexSearchQuery },
      deleted: false,
      courses: { $in: courseId },
    })
      .select("-password")
      .skip(parseInt(studentsCount || 0))
      .limit(parseInt(studentsCount || 0) + 30);

    const totalLength = await Student.countDocuments({
      fullName: { $regex: regexSearchQuery },
      deleted: false,
      courses: { $in: courseId },
    });

    res.status(200).json({ students, totalLength });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get students for pagination
export const getStudentsForPagination = async (req, res) => {
  const { searchQuery, length } = req.query;
  const limit = 20;

  try {
    let filterObj = {};

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");
      filterObj.fullName = { $regex: regexSearchQuery };
    }

    const totalLength = await Student.countDocuments({
      ...filterObj,
    });

    let students = await Student.find({
      ...filterObj,
    })
      .select("-password")
      .skip(length || 0)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({ students, totalLength });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Update student
export const updateStudent = async (req, res) => {
  const { email } = req.body;
  const { id: userId, role } = req.user;
  let updatedData = req.body;

  const currentUser = await getCurrentUser(userId, role);

  try {
    if (!currentUser) {
      return res.status(404).json({ key: "user-not-found" });
    }

    const regexEmail = new RegExp(`^${email}$`, "i");

    const existingAdmin = await Admin.findOne({
      email: { $regex: regexEmail },
    });
    const existingStudent = await Student.findOne({
      email: { $regex: regexEmail },
      _id: { $ne: id },
    });

    if (email && (existingAdmin || existingStudent)) {
      return res.status(409).json({ key: "email-already-exist" });
    }

    const updatedStudent = await Student.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    if (!updatedStudent) {
      return res.status(404).json({ key: "student-not-found" });
    }

    res.status(200).json({ ...updatedStudent.toObject(), password: "" });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete student
export const deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedStudent = await Student.findByIdAndUpdate(
      id,
      {
        deleted: true,
      },
      { new: true }
    );

    if (!deletedStudent) {
      return res.status(404).json({ key: "student-not-found" });
    }

    res.status(200).json(deletedStudent);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Update student password
export const updateStudentPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.user;

  try {
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const isPasswordCorrect = await bcrypt.compare(
      oldPassword,
      student.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({ key: "old-password-incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    res.status(200).json({ ...updatedStudent.toObject(), password: "" });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
