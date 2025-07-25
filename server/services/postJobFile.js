const multer = require("multer");
const fs = require('fs');

const uploadDir = './uploads/JobFiles/';

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {        
        const fileName = file.originalname.split(" ").join("-");
        cb(null, Date.now() + "-" + fileName);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only DOC, DOCX, Excel and PDF file types are allowed.'));
    }
};

const upload = multer({
    storage: fileStorage,
    limits: {
        fileSize: 1024 * 1024 * 5,
    },
    fileFilter: fileFilter,
});


module.exports = upload;
