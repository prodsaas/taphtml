const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, `logo-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|webp|svg/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

    const allowedMimeTypes = /jpeg|jpg|png|webp|svg\+xml/;
    const mimetype = allowedMimeTypes.test(file.mimetype);

    if (extname && mimetype) return cb(null, true);
    cb(new Error("Only images (PNG, JPG, JPEG, WEBP, SVG) are allowed"));
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
}).single("logo");

const uploadImage = (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ message: "Image size cannot exceed 5 MB" });
            }
            return res.status(400).json({ message: err.message });
        }
        else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

module.exports = uploadImage;