const express = require("express");
const path = require("path");
const routes = require("./routes");
const session = require('express-session');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cors = require("cors");

require('dotenv').config();
const mongoDB = require('./config/db/mongoDB')
const { seedPlans } = require('./config/db/seedPlans')
const app = express();

// Kết nối DB xong thì seed gói dịch vụ mặc định (chỉ chạy khi collection rỗng).
mongoDB.connect().then(() => seedPlans())

app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Tăng giới hạn để nhận avatar dạng base64 (mặc định 100kb là quá nhỏ)
app.use(bodyParser.urlencoded({ extended: false, limit: '5mb' }));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(express.json({ limit: '5mb' }));
// Cho phép NHIỀU origin (dev + production). Khai báo trong CLIENT_URL, ngăn cách bằng dấu phẩy.
// Vd: CLIENT_URL=http://localhost:5173,https://posta-solution.vercel.app
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, "")) // bỏ "/" cuối để so khớp ổn định
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Không có origin = request server-to-server (webhook SePay, Postman) → cho qua.
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin không được phép - ${origin}`));
  },
  methods: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  credentials: true,
}));

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});


app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: true
}));

app.get('/test-upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'uploads', 'posts', 'images-1764080546712.jpg'));
});

app.get('/', (req, res) => {
  console.log('Hit / ')
  res.send('Server is running ✅');
});

routes(app);

const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running at http://localhost:${process.env.PORT || 3000}`);
});

