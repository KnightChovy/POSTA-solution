const fs = require("fs")
const upload = require("../../config/file/upload")
const Post = require("../models/Post")
const { cloudinary, isCloudinaryEnabled } = require("../../config/cloudinary")
const saveImageToServer = async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  console.log("Received files: ", files)

  // Luôn tạo Post (imagePath rỗng nếu không upload ảnh) để không trả về null,
  // tránh các bước sau dereference newPost._id trên null gây crash.
  const imagePath = files.map(file =>
    file.path
      .replace(/\\/g, "/")
      .replace(/^src\/?/, "")
  );

  const newPost = new Post({ imagePath });
  await newPost.save();
  return newPost._id;
}

// Upload 1 ảnh lên server và trả về URL công khai (phục vụ tĩnh qua /uploads).
// Dùng cho editor: chèn thẳng URL này vào <img>, khỏi upload vào media từng
// WordPress (tránh CORS + không lộ application password ra trình duyệt).
const uploadImageReturnUrl = async (req, res) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file) {
      return res.status(400).json({ message: "Không có ảnh được tải lên" });
    }

    // Có cấu hình Cloudinary -> đẩy lên CDN, trả URL bền (không lo Render xóa đĩa).
    if (isCloudinaryEnabled()) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "posta/posts",
      });
      // Ảnh đã ở Cloudinary -> xóa file tạm trên server (đỡ phình đĩa). Lỗi xóa
      // không ảnh hưởng kết quả nên nuốt im lặng.
      fs.unlink(file.path, () => {});
      return res
        .status(201)
        .json({ url: result.secure_url, path: result.public_id });
    }

    // Fallback (local dev chưa cấu hình Cloudinary): phục vụ tĩnh từ server.
    // src/uploads/posts/xxx.png -> uploads/posts/xxx.png
    const relPath = file.path.replace(/\\/g, "/").replace(/^src\/?/, "");
    const base = (process.env.SERVER_URL || `${req.protocol}://${req.get("host")}`)
      .replace(/\/$/, "");
    return res.status(201).json({ url: `${base}/${relPath}`, path: relPath });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { saveImageToServer, uploadImageReturnUrl };