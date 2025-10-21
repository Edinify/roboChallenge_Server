import multer from "multer";
import path from "path";
import fs from "fs";

const uploadPath = "uploads/images";
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/svg+xml",
    "image/webp",
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

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

export const uploadImage = () =>
  multer({
    storage: diskStorage,
    fileFilter: imageFileFilter,
  });
