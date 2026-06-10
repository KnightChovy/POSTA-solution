const Satellite = require("../models/Satellite");
const Post = require("../models/Post");
const Category = require("../models/Category");

// Các nền tảng vệ tinh được hỗ trợ.
const PLATFORMS = ["WORDPRESS", "TWITTER", "FACEBOOK"];

// Credential bắt buộc theo từng nền tảng social (WordPress validate riêng bên dưới).
const REQUIRED_CREDENTIALS = {
  TWITTER: ["clientId", "clientSecret", "refreshToken"], // OAuth 2.0 user context
  // FACEBOOK: không bắt buộc — Page lấy từ FB_PAGE_ID/FB_PAGE_ACCESS_TOKEN ở .env.
};
// DONE: Get all satellites
const getAllSatellites = async (req, res) => {
  try {
    // Chỉ trả về vệ tinh của chính user đang đăng nhập (đa người dùng).
    const satellites = await Satellite.find({ owner: req.user.id, status: 'ACTIVE' });
    return res.status(200).json({ satellites });
  } catch (error) {
    return res.status(500).json({ error });
  }
}

// DONE: Add a new satellite
const addSatellite = async (req, res) => {
  try {
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    const { url, username, password, category, credentials = {} } = req.body;
    const platform = req.body.platform || "WORDPRESS";

    if (!PLATFORMS.includes(platform)) {
      return res.status(400).json({ message: "Nền tảng không hợp lệ" });
    }

    if (platform === "WORDPRESS") {
      // WordPress cần đủ url + username + Application Password.
      if (!url || !username || !password) {
        return res.status(400).json({
          message: "WordPress cần URL, username và Application Password",
        });
      }
      // Chống trùng theo từng user: 2 user khác nhau vẫn có thể dùng cùng 1 URL.
      const existingUrl = await Satellite.findOne({ url, owner: req.user.id, status: 'ACTIVE' });
      if (existingUrl) {
        return res.status(400).json({ message: "Website vệ tinh đã tồn tại" });
      }
    } else {
      // Kiểm tra credential bắt buộc theo nền tảng (Facebook không bắt buộc → [] ).
      const missing = (REQUIRED_CREDENTIALS[platform] || []).filter(
        (key) => !credentials[key]
      );
      if (missing.length) {
        return res.status(400).json({
          message: `Thiếu thông tin ${platform}: ${missing.join(", ")}`,
        });
      }
    }

    // Validate categories if provided
    if (category && category.length > 0) {
      const validCategories = await Category.find({
        _id: { $in: category },
        status: 'ACTIVE'
      });

      if (validCategories.length !== category.length) {
        return res.status(400).json({
          message: "One or more categories are invalid or inactive"
        });
      }
    }

    const newSatellite = new Satellite({
      platform,
      url,
      username,
      password,
      // Chỉ social mới lưu credentials; WordPress dùng url/username/password.
      credentials: platform === "WORDPRESS" ? {} : credentials,
      category: category || [],
      owner: req.user?.id, // gắn chủ sở hữu để đếm quota website theo user
    });

    newSatellite
      .save()
      .then((satellite) => res.status(201).json({ satellite }))
      .catch((error) => res.status(500).json({ error }));
  } catch (error) {
    res.status(500).json({ error });
  }
};

// DONE: Get number of published posts across all satellites
const getNumberOfPublishedPosts = async (req, res) => {
  try {
    const result = await Post.aggregate([
      {
        $unwind: '$postedSatellite'
      },
      {
        $group: {
          _id: null,
          totalLength: { $sum: 1 }
        }
      }
    ]);
    if (result.length <= 0) {
      return res.json({ success: false, message: 'No published posts found.' });
    }
    return res.json({ success: true, totalPublishedPosts: result[0]?.totalLength || 0 });
  } catch (error) {
    console.error("Error counting published posts:", error);
    res.status(500).json({ error });
  }
}

// DONE: Get number of error posts across all satellites
const getNumberOfErrorPosts = async (req, res) => {
  try {
    const result = await Post.aggregate([
      {
        $unwind: '$errorSatellite'
      },
      {
        $group: {
          _id: null,
          totalLength: { $sum: 1 }
        }
      }
    ]);
    if (result.length <= 0) {
      return res.json({ success: false, message: 'No error posts found.' });
    }
    return res.json({ success: true, totalErrorPosts: result[0]?.totalLength || 0 });
  } catch (error) {
    console.error("Error counting error posts:", error);
    res.status(500).json({ error });
  }
}

// DONE: Get overall progress of all posts
const getOverallProgress = async (req, res) => {
  try {
    const posts = await Post.find({ successfulRate: { $ne: 0 } });
    const total = posts.reduce((sum, p) => sum + p.successfulRate, 0);
    const average = total / posts.length;
    if (isNaN(average)) {
      return res.status(200).json({ success: true, averageSuccessfulRate: 0 });
    }
    res.status(200).json({ success: true, averageSuccessfulRate: average });
  } catch (error) {
    res.status(500).json({ error });
  }
}

// DONE: Update satellite details
const updateSatellite = async (req, res) => {
  try {
    const { id } = req.params;
    const { url, username, password, platform, credentials } = req.body;

    const satellite = await Satellite.findById(id);
    if (!satellite) {
      return res.status(404).json({ message: "Satellite not found" });
    }
    // Chỉ chủ sở hữu mới được sửa.
    if (String(satellite.owner) !== String(req.user.id)) {
      return res.status(403).json({ message: "Bạn không có quyền sửa website vệ tinh này" });
    }

    // Chỉ cập nhật field nào client gửi lên (tránh ghi đè undefined).
    const update = { url, username, password };
    if (platform) update.platform = platform;
    if (credentials) update.credentials = credentials;

    const updatedSatellite = await Satellite.findByIdAndUpdate(
      id,
      update,
      { new: true }
    );

    res.status(200).json({
      message: "Satellite updated successfully",
      satellite: updatedSatellite
    });
  } catch (error) {
    console.error("Error updating satellite:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

const deleteSatellite = async (req, res) => {
  try {
    const { id } = req.params;
    const satellite = await Satellite.findById(id);
    if (!satellite) {
      return res.status(404).json({ message: "Satellite not found" });
    }
    // Chỉ chủ sở hữu mới được xoá.
    if (String(satellite.owner) !== String(req.user.id)) {
      return res.status(403).json({ message: "Bạn không có quyền xoá website vệ tinh này" });
    }
    satellite.status = 'INACTIVE';
    await satellite.save();
    res.status(200).json({ message: "Satellite deleted successfully" });
  } catch (error) {
    res.status(500).json({ error });
  }
}

module.exports = {
  addSatellite,
  getNumberOfPublishedPosts,
  getNumberOfErrorPosts,
  getOverallProgress,
  getAllSatellites,
  updateSatellite,
  deleteSatellite
};