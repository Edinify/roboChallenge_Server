import { Admin } from "../models/adminModel.js";
import { Exam } from "../models/examModel.js";
import { ExamVersion } from "../models/examVersionModel.js";
import { ExamVersionQuestion } from "../models/examVersionQuestionModel.js";
import { StudentExam } from "../models/studentExamModel.js";
import { StudentExamQuestion } from "../models/studentExamQuestionModel.js";
import { Student } from "../models/studentModel.js";
import { Visitor } from "../models/visitorModel.js";

export const startStudentExam = async (req, res) => {
  const { examId } = req.body;
  const { id } = req.user;

  try {
    const exam = await Exam.findById(examId).populate("courses.course");

    if (!exam) {
      return res
        .status(404)
        .json({ key: "exam-not-found", message: "exam not found" });
    }

    const versions = await ExamVersion.find({ examId });

    if (versions.length === 0)
      return res
        .status(404)
        .json({ key: "not-version", message: "No versions found" });

    // const randomVersion = versions[Math.floor(Math.random() * versions.length)];
    const randomVersion = versions[Math.floor(Math.random() * 1)];

    const allVersionQuestions = await ExamVersionQuestion.find({
      examVersionId: randomVersion._id,
    });

    if (!allVersionQuestions.length)
      return res
        .status(404)
        .json({ key: "not-question", message: "No questions found" });

    const courses = exam.courses.map((item) => item.course.name);
    const duringWithMs = exam.during * 60 * 1000;

    const newStudentExam = new StudentExam({
      user: id,
      title: exam.title,
      description: exam.description,
      version: randomVersion.version,
      courses: courses,
      during: exam.during,
      startedAt: Date.now(),
      endedAt: Date.now() + duringWithMs,
    });

    await newStudentExam.save();

    const clonedQuestions = allVersionQuestions.map((question) => ({
      studentExamId: newStudentExam._id,
      course: question.course,
      text: question.text,
      type: question.type,
      difficulty: question.difficulty,
      options: question.options,
      correctOptions: question.correctOptions,
      images: question.images,
    }));

    await StudentExamQuestion.insertMany(clonedQuestions);

    res.status(201).json(newStudentExam);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

export const completeStudentExam = async (req, res) => {
  const { id } = req.params;

  try {
    const exam = await StudentExam.findByIdAndUpdate(
      id,
      {
        isCompleted: true,
        completedAt: Date.now(),
      },
      {
        new: true,
      }
    );

    const questions = await StudentExamQuestion.find({
      studentExamId: exam._id,
    });

    console.log(questions, "QUESTIONS");

    const correctCount = questions.reduce(
      (acc, question) =>
        question.userAnswer.sort().join("") ===
        question.correctOptions.sort().join("")
          ? acc + 1
          : acc,
      0
    );

    res.status(201).json({
      ...exam.toObject(),
      questionsCount: questions.length,
      correctCount,
    });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getStudentExams = async (req, res) => {
  const { id } = req.user;

  try {
    const exams = await StudentExam.find({ user: id });

    res.status(201).json(exams);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getExamsResultsForPagination = async (req, res) => {
  const { searchQuery, length } = req.query;
  const limit = 20;
  const { id, role } = req.user;

  try {
    const filterObj = {
      $or: [{ isCompleted: true }, { endedAt: { $lt: Date.now() } }],
    };

    if (role === "visitor") {
      filterObj.user = id;
    }
    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");
      filterObj.title = { $regex: regexSearchQuery };
    }

    const exams = await StudentExam.find(filterObj)
      .skip(length || 0)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalLength = await StudentExam.countDocuments({
      ...filterObj,
    });

    const results = await Promise.all(
      exams.map(async (exam) => {
        const result = { ...exam.toObject() };

        let user = await Visitor.findById(exam.user);

        if (!user) {
          user = await Student.findById(exam.user);
        }

        if (!user) {
          user = await Admin.findById(exam.user);
        }

        const questions = await StudentExamQuestion.find({
          studentExamId: exam._id,
        });

        const allQuestionsCount = questions.length;
        const openQuestionsCount = questions.reduce(
          (acc, question) => (question.type === "open" ? acc + 1 : acc),
          0
        );
        const closeQuestionsCount = questions.reduce(
          (acc, question) => (question.type === "close" ? acc + 1 : acc),
          0
        );
        console.log(questions, "questions");
        const correctCount = questions.reduce(
          (acc, question) =>
            question.userAnswer.sort().join("") ===
            question.correctOptions.sort().join("")
              ? acc + 1
              : acc,
          0
        );

        result.allQuestionsCount = allQuestionsCount;
        result.openQuestionsCount = openQuestionsCount;
        result.closeQuestionsCount = closeQuestionsCount;
        result.correctCount = correctCount;
        result.user = user;

        return result;
      })
    );

    console.log(results, "Results");

    res.status(201).json({ results, totalLength });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getUncompletedStudentExams = async (req, res) => {
  const { id } = req.user;

  try {
    const exams = await StudentExam.find({
      user: id,
      isCompleted: false,
      endedAt: { $gt: Date.now() },
    });

    res.status(201).json(exams);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getStudentExamById = async (req, res) => {
  const { id } = req.params;

  try {
    const exam = await StudentExam.findById(id);

    if (!exam) {
      return res
        .status(404)
        .json({ key: "exam-not-found", message: "exam not found" });
    }

    const result = { ...exam.toObject() };

    if (exam.isCompleted || exam.endedAt < Date.now()) {
      const questions = await StudentExamQuestion.find({
        studentExamId: exam._id,
      });

      const correctCount = questions.reduce(
        (acc, question) =>
          question.userAnswer.sort().join("") ===
          question.correctOptions.sort().join("")
            ? acc + 1
            : acc,
        0
      );

      result.questionsCount = questions.length;
      result.correctCount = correctCount;
    }

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
