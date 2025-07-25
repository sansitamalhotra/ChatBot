const multer = require("multer");
const fs = require('fs');
const path = require('path');

const uploadDir = './uploads/UserPhotos/';

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, uploadDir);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {        
        const fileName = file.originalname.replace(/\s+/g, '-');
        cb(null, `${Date.now()}-${fileName}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only jpeg, jpg, png, and gif file types are allowed.'));
    }
};

const uploadPhoto = multer({
    storage: fileStorage,
    limits: {
        fileSize: 1024 * 1024 * 5,
    },
    fileFilter: fileFilter,
});

module.exports = uploadPhoto;
