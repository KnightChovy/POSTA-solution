require("dotenv").config();
const cloudinary = require("cloudinary").v2;

// Cấu hình Cloudinary từ biến môi trường. Khi deploy (Render) đặt 3 biến này ở
// phần Environment của service, KHÔNG commit secret vào code.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Đã cấu hình đủ khóa hay chưa (để controller fallback về lưu đĩa khi chưa có).
const isCloudinaryEnabled = () =>
  !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

module.exports = { cloudinary, isCloudinaryEnabled };
