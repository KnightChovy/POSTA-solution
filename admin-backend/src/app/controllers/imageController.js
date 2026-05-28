const upload = require("../../config/file/upload")
const Post = require("../models/Post")
const saveImageToServer = async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  console.log("Received files: ", files)
  if (!files || files.length === 0) {
    return null;
  }

  const imagePath = files.map(file =>
    file.path
      .replace(/\\/g, "/")
      .replace(/^src\/?/, "")
  );

  const newPost = new Post({});
  newPost.imagePath = imagePath;

  await newPost.save();
  return newPost._id;
}

module.exports = { saveImageToServer };