import { StudyMaterial } from "../models/studyMaterialsModel.js";

export const createStudyMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ key: "no-file", message: "No file uploaded" });
    }

    const pdfPath = `/uploads/pdfs/${req.file.filename}`;

    const newData = await StudyMaterial.create({
      title: req.body.title,
      pdfUrl: pdfPath,
    });

    res.status(200).json(newData);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getStudyMaterials = async (req, res) => {
  try {
    const studyMaterials = await StudyMaterial.find();

    res.status(200).json(studyMaterials);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const deleteStudyMaterial = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedData = await StudyMaterial.findByIdAndDelete(id);

    if (!deletedData) {
      return res
        .status(404)
        .json({ key: "not-found", message: "Study material not found" });
    }

    const fullPath = path.join(process.cwd(), deletedData.pdfUrl);
    fs.unlink(fullPath, (err) => {
      if (err) {
        console.error("Pdf file deletion error:", err.message);
      }
    });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
