const multer = require("multer")
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "src/uploads/posts/");
  },
  filename: function (req, file, cb) {
    // Giữ đúng đuôi gốc (jpg/png/webp...), fallback theo mimetype nếu thiếu
    const ext =
      path.extname(file.originalname).toLowerCase() ||
      `.${file.mimetype.split("/")[1]}`;
    cb(null, file.fieldname + "-" + Date.now() + ext);
  }
});
const maxSize = 10 * 1000 * 1000; // 10 MB

const upload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error("Chỉ hỗ trợ định dạng ảnh: jpeg, jpg, png, webp, gif"));
  }
}) 

module.exports = upload;