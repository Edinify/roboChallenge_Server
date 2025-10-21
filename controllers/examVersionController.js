import { ExamVersion } from "../models/examVersionModel.js";

export const createExamVersion = async (req, res) => {
  const { examId } = req.params;

  try {
    const examVersionCount = await ExamVersion.countDocuments({
      examId: examId,
    });

    console.log(examVersionCount);

    const newExamVersion = new ExamVersion({
      examId,
      version: examVersionCount + 1,
    });

    await newExamVersion.save();

    res.status(201).json(newExamVersion);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getAllExamVersions = async (req, res) => {
  const { examId } = req.params;

  try {
    const examVersions = await ExamVersion.find({ examId }).sort({
      version: 1,
    });

    res.status(200).json(examVersions);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getExamVersionById = async (req, res) => {
  const { id } = req.params;

  try {
    const examVersion = await ExamVersion.findById(id);

    if (!examVersion) {
      return res
        .status(404)
        .json({ key: "not-found", message: "exam version not found" });
    }
    res.status(200).json(examVersion);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const deleteExamVersion = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedExam = await ExamVersion.findByIdAndDelete(id);

    if (!deletedExam) {
      return res
        .status(404)
        .json({ key: "not-found", message: "Exam not found" });
    }

    await ExamVersion.updateMany(
      {
        examId: deletedExam.examId,
        version: { $gt: deletedExam.version },
      },
      {
        $inc: { version: -1 },
      }
    );

    res.status(200).json(deletedExam);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
