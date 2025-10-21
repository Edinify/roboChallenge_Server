import { Exam } from "../models/examModel.js";
import { Order } from "../models/orderModel.js";
import { Student } from "../models/studentModel.js";

export const createExam = async (req, res) => {
  const { title, description, courses, during } = req.body;

  try {
    const newExam = new Exam({ title, description, courses, during });

    await newExam.save();

    res.status(201).json(newExam);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getAllExams = async (req, res) => {
  const { searchQuery, courseId } = req.query;

  try {
    let filterObj = {};
    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");
      filterObj.title = { $regex: regexSearchQuery };
    }

    const exams = await Exam.find(filterObj).sort({ createdAt: -1 });

    res.status(200).json(exams);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getAllExamsByStudent = async (req, res) => {
  const { id } = req.user;

  try {
    const user = await Student.findById(id).select("-password");

    const exams = await Exam.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "orders",
          let: { examId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$exam", "$$examId"] },
                    { $eq: ["$student", user._id] },
                    { $eq: ["$status", "paid"] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "paidOrder",
        },
      },
      {
        $lookup: {
          from: "examEnrollments",
          let: { examId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$exam", "$$examId"] },
                    { $eq: ["$student", user._id] },
                    { $eq: ["$status", "valid"] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "userAttempt",
        },
      },
      {
        $addFields: {
          hasPurchased: { $gt: [{ $size: "$paidOrder" }, 0] },
          hasParticipated: { $gt: [{ $size: "$userAttempt" }, 0] },
          student: {
            ...user.toObject(),
            password: "",
          },
        },
      },

      { $project: { paidOrder: 0, userAttempt: 0 } },
      { $sort: { createdAt: -1 } },
    ]);

    res.status(200).json(exams);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
export const getExamById = async (req, res) => {
  const { id } = req.params;

  try {
    const exam = await Exam.findById(id);

    res.status(200).json(exam);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const payToExam = async (req, res) => {
  const { examId } = req.params;
  const { id } = req.user;

  try {
    const exam = await Exam.findOne({
      _id: examId,
      isActive: true,
    });

    if (!exam) {
      return res
        .status(404)
        .json({ key: "exam-not-found", message: "Exam not found" });
    }

    
    await Order.create({
      student: id,
      exam: examId,
      price: exam.price,
      status: "paid",
    })



  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const updateExam = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedExam = await Exam.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedExam) {
      return res
        .status(404)
        .json({ key: "not-found", message: "Exam not found" });
    }

    res.status(200).json(updatedExam);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const deleteExam = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedExam = await Exam.findByIdAndDelete(id);

    if (!deletedExam) {
      return res
        .status(404)
        .json({ key: "not-found", message: "Exam not found" });
    }

    res.status(200).json(deletedExam);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
