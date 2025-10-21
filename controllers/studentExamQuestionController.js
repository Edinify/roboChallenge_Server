import { StudentExam } from "../models/studentExamModel.js";
import { StudentExamQuestion } from "../models/studentExamQuestionModel.js";

export const getStudentExamQuestions = async (req, res) => {
  const { studentExamId } = req.params;

  try {
    const exam = await StudentExam.findById(studentExamId);

    if (exam.isCompleted || exam.endedAt < Date.now()) {
      return res.status(400).json({ key: "exam-completed" });
    }

    const questions = await StudentExamQuestion.find({ studentExamId });

    res.status(201).json(questions);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const answerStudentExamQuestion = async (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;

  try {
    const question = await StudentExamQuestion.findById(id);
    const exam = await StudentExam.findById(question.studentExamId);

    if (exam.isCompleted || exam.endedAt < Date.now()) {
      return res.status(400).json({ key: "exam-completed" });
    }

    if (question.userAnswer.includes(answer)) {
      question.userAnswer = question.userAnswer.filter((opt) => opt !== answer);
    } else {
      if (question.type === "close") {
        question.userAnswer = [answer];
      } else {
        question.userAnswer.push(answer);
      }
    }

    await question.save();

    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const hesitateStudentExamQuestion = async (req, res) => {
  const { id } = req.params;

  try {
    const question = await StudentExamQuestion.findById(id);
    const exam = await StudentExam.findById(question.studentExamId);

    if (exam.isCompleted || exam.endedAt < Date.now()) {
      return res.status(400).json({ key: "exam-completed" });
    }

    question.isHesitated = !question.isHesitated;

    await question.save();

    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
