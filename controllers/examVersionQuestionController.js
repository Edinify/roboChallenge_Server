import { ExamVersionQuestion } from "../models/examVersionQuestionModel.js";
import { Question } from "../models/questionModel.js";

export const createExamVersionQuestions = async (req, res) => {
  const { examVersionId } = req.params;
  const { selectedQuestionsIds } = req.body;

  try {
    const selectedQuestions = await Question.find({
      _id: { $in: selectedQuestionsIds },
    }).populate("course");

    const examVersionQuestions = selectedQuestions.map((question) => ({
      examVersionId,
      mainQuestionId: question._id,
      course: question.course.name,
      text: question.text,
      images: question.images,
      type: question.type,
      difficulty: question.difficulty,
      options: question.options,
      correctOptions: question.correctOptions,
    }));

    await ExamVersionQuestion.insertMany(examVersionQuestions);

    const allExamVersionQuestions = await ExamVersionQuestion.find({
      examVersionId,
    });

    res.status(201).json(allExamVersionQuestions);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getExamVersionQuestions = async (req, res) => {
  const { examVersionId } = req.params;
  try {
    const questions = await ExamVersionQuestion.find({ examVersionId });

    res.status(200).json(questions);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const deleteExamVersionQuestion = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedQuestion = await ExamVersionQuestion.findByIdAndDelete(id);

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
