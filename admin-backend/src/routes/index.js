const satellite = require("./satellite");
const category = require("./category");
const auth = require("./auth");
const admin = require("./admin");
const image = require("./image");
const post = require("./post");
const plan = require("./plan");
const payment = require("./payment");
const social = require("./social");
const authenticateJWT = require("../middleware/AuthenticateJWT");

function routes(app) {
  // Public: đăng nhập / đăng ký / xác thực / refresh token
  app.use("/api/auth", auth);

  // Gói dịch vụ: GET công khai, mua/subscription tự gắn JWT bên trong
  app.use("/api/plans", plan);

  // Thanh toán SePay: webhook + dev-confirm (public, tự xác thực)
  app.use("/api/payment", payment);

  // AI paraphrase cho social — n8n gọi từ ngoài, không qua JWT
  app.use("/api/social", social);

  // Khu vực quản trị (tự kiểm tra admin bên trong)
  app.use("/api/admin", admin);

  // Yêu cầu access token hợp lệ cho các API dữ liệu
  app.use("/api/satellite", authenticateJWT, satellite);
  app.use("/api/category", authenticateJWT, category);
  app.use("/api/image", authenticateJWT, image);
  app.use("/api/post", authenticateJWT, post);
}

module.exports = routes;
