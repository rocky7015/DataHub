const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

let storage;

if (process.env.CLOUDINARY_URL) {
  // Use Cloudinary if credentials are provided in env
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'dataset_platform',
      resource_type: 'raw', // Support raw files like CSV, JSON, XLSX
      public_id: (_req, file) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        return `dataset-${uniqueSuffix}-${file.originalname}`;
      },
    },
  });
} else {
  // Fallback to local disk storage
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `dataset-${uniqueSuffix}${ext}`);
    },
  });
}

// Only allow specific file types
const fileFilter = (_req, file, cb) => {
  const allowed = ['.csv', '.json', '.xlsx', '.xls', '.txt', '.tsv'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowed.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

module.exports = upload;
