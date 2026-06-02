const axios = require('axios')
const { createBasicAuthHeader } = require('../utils/apiUtils')

// Quy ước mã lỗi ghi vào errorSatellite.errorCode (khớp getErrorMessage ở frontend):
//   400 = site OK nhưng chưa có ảnh để đăng
//   401/403 = sai thông tin đăng nhập / bị chặn
//   404 = không tìm thấy site tương ứng trong dữ liệu gửi lên
//   500 = lỗi máy chủ của site vệ tinh
//   501 = kết nối được nhưng site không có WordPress REST API (vd site wordpress.com)
//   503 = không kết nối được (domain không tồn tại / site sập / timeout)

const cleanUrl = (url) =>
  String(url).trim().replace(/^['"]|['"]$/g, '').replace(/\n/g, '')

// Suy ra mã lỗi từ một lỗi axios: có response → dùng HTTP status; không có → lỗi mạng (503)
const errorCodeFromAxios = (error) => error?.response?.status || 503

// Thăm dò REST API của site. Trả về null nếu dùng được, hoặc mã lỗi (501/503).
const checkSatelliteRestApi = async (url) => {
  try {
    const endpoint = new URL('wp-json/wp/v2/', cleanUrl(url)).href
    const res = await axios.get(endpoint, { timeout: 10000, validateStatus: () => true })
    // 404 = không có REST API; 2xx/401 = có (401 chỉ là yêu cầu xác thực)
    return res.status === 404 ? 501 : null
  } catch (error) {
    return 503
  }
}

const postToSatellite = async (satellite, post) => {
  try {
    const { title, content } = post
    const status = 'publish'

    let { url, username, password } = satellite

    if (typeof url === 'string') {
      url = url.trim().replace(/^['"]|['"]$/g, '').replace(/\n/g, '')
    }

    if (!url || !url.startsWith('http')) {
      throw new Error(`Invalid URL format: ${url}`)
    }

    return await axios.post(
      `${url}/wp-json/wp/v2/posts`,
      { title, content, status },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': createBasicAuthHeader(username, password),
        },
      }
    )
  } catch (error) {
    console.log("lỗi khi gửi wp", error)
    throw error
  }
}

module.exports = { postToSatellite, checkSatelliteRestApi, errorCodeFromAxios }