const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { FILE_UPLOAD } = require('../utils/constants');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: FILE_UPLOAD.MAX_SIZE },
  fileFilter: uploadController.constructor.validateFile
});

// Upload file
router.post('/', upload.single('file'), uploadController.uploadFile);

// Get file info
router.get('/:filename', uploadController.getFileInfo);

// Delete file
router.delete('/:filename', uploadController.deleteFile);

module.exports = router;