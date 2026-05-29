const upload = require("../../config/file/upload")
const Post = require("../models/Post")
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

module.exports = { saveImageToServer };