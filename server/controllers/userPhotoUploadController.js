const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/userModel'); // Import User model

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/userAvatars');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `user-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// File filter to validate image uploads
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1 * 1024 * 1024 } // 1MB limit
});

const uploadUserPhoto = {
  uploadPhoto: (req, res) => {
    upload.single('photo')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ 
          msg: err instanceof multer.MulterError ? 'File upload error' : err.message 
        });
      }

      if (!req.file) {
        return res.status(400).json({ msg: 'No photo uploaded' });
      }

      try {
        const photoUrl = `/uploads/userAvatars/${req.file.filename}`;
        res.json({ url: photoUrl });
      } catch (error) {
        res.status(500).json({ msg: 'Server error: ' + error.message });
      }
    });
  }
};

const updateUserPhoto = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.body.photoUrl) {
      return res.status(400).json({ success: false, message: "Photo URL is required" });
    }

    const updatedUserPhoto = await User.findByIdAndUpdate(userId, { photo: req.body.photoUrl }, { new: true });

    if (!updatedUserPhoto) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "Photo Updated Successfully!", user: updatedUserPhoto });

  } catch (error) {
    console.error('Error Updating Your Photo: ', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

module.exports = { uploadPhoto: uploadUserPhoto.uploadPhoto, updateUserPhoto };
