import multer from "multer";
import path from "path";
import fs from "fs";

const imgUploadPath = "uploads/images";
const pdfUploadPath = "uploads/pdfs";

if (!fs.existsSync(imgUploadPath)) {
  fs.mkdirSync(imgUploadPath, { recursive: true });
}

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/svg+xml",
    "image/webp",
    "application/pdf",
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, SVG, and WEBP are allowed."
      ),
      false
    );
  }
};

const diskStorageForImg = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imgUploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const diskStorageForPdf = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, pdfUploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

export const uploadImage = () =>
  multer({
    storage: diskStorageForImg,
    fileFilter: fileFilter,
  });

export const uploadPdf = () =>
  multer({
    storage: diskStorageForPdf,
    fileFilter: fileFilter,
  });
