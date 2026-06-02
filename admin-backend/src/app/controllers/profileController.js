const User = require('../models/User');

const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // ~3MB cho chuỗi base64

// Avatar lưu base64 (data:...) hoặc URL http → trả nguyên trạng;
// nếu là đường dẫn cũ kiểu /uploads/... thì ghép SERVER_URL.
function resolveAvatar(avatar) {
  if (!avatar) return '';
  if (avatar.startsWith('data:') || avatar.startsWith('http')) return avatar;
  return `${process.env.SERVER_URL || ''}${avatar}`;
}

function toProfile(user) {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    avatar: resolveAvatar(user.avatar),
    jobTitle: user.jobTitle || '',
    company: user.company || '',
    website: user.website || '',
    address: user.address || '',
    bio: user.bio || '',
    isAdmin: !!user.isAdmin,
    createdAt: user.createdAt,
  };
}

// GET /api/auth/me — hồ sơ của người đang đăng nhập.
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: true, message: 'Không tìm thấy người dùng' });
    }
    return res.json({ error: false, user: toProfile(user) });
  } catch (error) {
    console.error('[profile] Get profile error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// PATCH /api/auth/profile — cập nhật thông tin hồ sơ. KHÔNG cho đổi email.
// Avatar nhận dưới dạng chuỗi base64 (data URL) trong body JSON.
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: true, message: 'Không tìm thấy người dùng' });
    }

    const { name, phone, jobTitle, company, website, address, bio, avatar } = req.body;

    if (typeof name === 'string' && name.trim()) user.name = name.trim();
    if (typeof phone === 'string') user.phone = phone.trim();
    if (typeof jobTitle === 'string') user.jobTitle = jobTitle.trim();
    if (typeof company === 'string') user.company = company.trim();
    if (typeof website === 'string') user.website = website.trim();
    if (typeof address === 'string') user.address = address.trim();
    if (typeof bio === 'string') user.bio = bio.trim();

    // Avatar mới (base64). Chuỗi rỗng = xoá ảnh; undefined = giữ nguyên.
    if (typeof avatar === 'string') {
      if (avatar === '') {
        user.avatar = '';
      } else if (avatar.startsWith('data:image/')) {
        if (avatar.length > MAX_AVATAR_BYTES) {
          return res.json({ error: true, message: 'Ảnh đại diện quá lớn (tối đa ~2MB)' });
        }
        user.avatar = avatar;
      } else {
        return res.json({ error: true, message: 'Định dạng ảnh đại diện không hợp lệ' });
      }
    }

    await user.save();
    return res.json({
      error: false,
      message: 'Cập nhật hồ sơ thành công',
      user: toProfile(user),
    });
  } catch (error) {
    console.error('[profile] Update profile error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

module.exports = { getProfile, updateProfile };
