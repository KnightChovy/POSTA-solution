const axios = require("axios");
const jwt = require("jsonwebtoken");
const Satellite = require("../models/Satellite");
const { encrypt } = require("../../utils/secretBox");

const GRAPH = "https://graph.facebook.com/v21.0";

// B1: Frontend (đã đăng nhập) gọi để lấy URL dialog OAuth của Facebook.
// state = JWT mang userId — vì callback do Facebook redirect tới sẽ KHÔNG có Bearer.
const getFacebookAuthUrl = (req, res) => {
  try {
    const appId = process.env.FB_APP_ID;
    const redirectUri = process.env.FB_REDIRECT_URI;
    if (!appId || !redirectUri) {
      return res.status(500).json({ message: "Chưa cấu hình FB_APP_ID / FB_REDIRECT_URI" });
    }
    const state = jwt.sign({ uid: req.user.id }, process.env.JWT_SECRET, { expiresIn: "10m" });
    // Quyền cần để liệt kê Page và đăng bài lên Page.
    const scope = "pages_show_list,pages_read_engagement,pages_manage_posts";
    const url =
      `https://www.facebook.com/v21.0/dialog/oauth` +
      `?client_id=${encodeURIComponent(appId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&response_type=code`;
    return res.json({ url });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// B2: Facebook redirect về đây kèm ?code&state. Đổi code → Page token rồi tạo satellite.
const facebookCallback = async (req, res) => {
  const frontend = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  const fail = (msg) =>
    res.redirect(`${frontend}/viewSat?fb=error&msg=${encodeURIComponent(msg)}`);
  try {
    const { code, state, error: fbError } = req.query;
    if (fbError) return fail("Bạn đã từ chối cấp quyền Facebook");
    if (!code || !state) return fail("Thiếu code hoặc state");

    let uid;
    try {
      uid = jwt.verify(state, process.env.JWT_SECRET).uid;
    } catch (e) {
      return fail("Phiên kết nối đã hết hạn, vui lòng thử lại");
    }

    const appId = process.env.FB_APP_ID;
    const appSecret = process.env.FB_APP_SECRET;
    const redirectUri = process.env.FB_REDIRECT_URI;

    // 1) code -> user token ngắn hạn
    const shortRes = await axios.get(`${GRAPH}/oauth/access_token`, {
      params: { client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code },
    });
    const shortToken = shortRes.data.access_token;

    // 2) đổi sang user token dài hạn (để Page token suy ra cũng dài hạn)
    const longRes = await axios.get(`${GRAPH}/oauth/access_token`, {
      params: {
        grant_type: "fb_exchange_token",
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: shortToken,
      },
    });
    const longToken = longRes.data.access_token;

    // 3) lấy danh sách Page mà user quản lý (kèm Page access token)
    const pagesRes = await axios.get(`${GRAPH}/me/accounts`, {
      params: { access_token: longToken, fields: "id,name,access_token" },
    });
    const pages = pagesRes.data.data || [];
    if (!pages.length) return fail("Tài khoản không quản lý Page nào");

    // 4) Tạo/cập nhật satellite FACEBOOK cho mỗi Page. Page token được MÃ HOÁ khi lưu.
    let count = 0;
    for (const p of pages) {
      await Satellite.findOneAndUpdate(
        { owner: uid, platform: "FACEBOOK", "credentials.pageId": p.id },
        {
          $set: {
            owner: uid,
            platform: "FACEBOOK",
            status: "ACTIVE",
            url: `https://www.facebook.com/${p.id}`,
            credentials: {
              pageId: p.id,
              pageAccessToken: encrypt(p.access_token),
              pageName: p.name || "",
            },
          },
        },
        { new: true, upsert: true }
      );
      count++;
    }

    return res.redirect(`${frontend}/viewSat?fb=connected&pages=${count}`);
  } catch (error) {
    console.log(
      "FB callback error:",
      error.response?.status || error.code || "",
      JSON.stringify(error.response?.data) || error.message
    );
    return fail(error.response?.data?.error?.message || error.message);
  }
};

module.exports = { getFacebookAuthUrl, facebookCallback };
