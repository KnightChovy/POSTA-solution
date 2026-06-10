const axios = require('axios')
const { createBasicAuthHeader } = require('../utils/apiUtils')
const Satellite = require('../app/models/Satellite')
const { decrypt } = require('../utils/secretBox')

// Đọc 1 credential của satellite. credentials có thể là Mongoose Map hoặc object thường.
const credValue = (satellite, key) => {
  const c = satellite?.credentials
  if (!c) return undefined
  return typeof c.get === 'function' ? c.get(key) : c[key]
}

// Chuyển HTML (nội dung WordPress) sang text thuần để đăng lên social.
const htmlToText = (html) =>
  String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()

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

// Đăng lên WordPress qua REST API (logic gốc của hệ thống).
const postToWordPress = async (satellite, post) => {
  try {
    // status/categories are optional so existing callers keep working unchanged.
    const { title, content, status = 'publish', categories } = post

    let { url, username, password } = satellite

    if (typeof url === 'string') {
      url = url.trim().replace(/^['"]|['"]$/g, '').replace(/\n/g, '')
    }

    if (!url || !url.startsWith('http')) {
      throw new Error(`Invalid URL format: ${url}`)
    }

    const payload = { title, content, status }
    if (Array.isArray(categories) && categories.length) {
      payload.categories = categories
    }

    return await axios.post(
      `${url}/wp-json/wp/v2/posts`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': createBasicAuthHeader(username, password),
        },
        timeout: Number(process.env.WP_TIMEOUT_MS || 30000),
      }
    )
  } catch (error) {
    // Log only safe fields — never the full error (its config carries the auth header).
    console.log('lỗi khi gửi wp:', error.response?.status || error.code || '', error.message)
    throw error
  }
}

// Đổi refresh token lấy access token mới (OAuth 2.0). Twitter XOAY VÒNG refresh token:
// mỗi lần dùng sẽ trả về refresh_token mới và vô hiệu cái cũ → phải lưu lại cái mới.
const refreshTwitterToken = async (clientId, clientSecret, refreshToken) => {
  const res = await axios.post(
    'https://api.twitter.com/2/oauth2/token',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // Client bí mật (confidential client) xác thực bằng Basic clientId:clientSecret.
        Authorization:
          'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      timeout: Number(process.env.WP_TIMEOUT_MS || 30000),
    }
  )
  return res.data // { access_token, refresh_token, expires_in, scope, token_type }
}

// Đăng tweet qua Twitter API v2 (POST /2/tweets) dùng OAuth 2.0 user context.
// Credential lấy từ satellite.credentials: clientId + clientSecret + refreshToken.
const postToTwitter = async (satellite, post) => {
  const clientId = credValue(satellite, 'clientId')
  const clientSecret = credValue(satellite, 'clientSecret')
  const refreshToken = credValue(satellite, 'refreshToken')
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Twitter satellite thiếu clientId/clientSecret/refreshToken (OAuth 2.0)')
  }

  // 1) Refresh để lấy access token mới (access token chỉ sống ~2h nên luôn refresh).
  let tokenData
  try {
    tokenData = await refreshTwitterToken(clientId, clientSecret, refreshToken)
  } catch (error) {
    console.log('lỗi refresh twitter token:', error.response?.status || error.code || '', JSON.stringify(error.response?.data) || error.message)
    throw error
  }

  // 2) Lưu refresh token mới vào DB (vì Twitter xoay vòng — cái cũ vừa dùng đã hết hiệu lực).
  if (tokenData.refresh_token && satellite._id) {
    try {
      await Satellite.findByIdAndUpdate(satellite._id, {
        $set: { 'credentials.refreshToken': tokenData.refresh_token },
      })
    } catch (e) {
      console.log('không lưu được refresh token mới:', e.message)
    }
  }

  // 3) Đăng tweet bằng Bearer access token. Tweet tối đa 280 ký tự.
  const raw = [post.title, htmlToText(post.content)].filter(Boolean).join(' — ')
  const text = raw.length > 280 ? raw.slice(0, 277) + '...' : raw
  try {
    const res = await axios.post(
      'https://api.twitter.com/2/tweets',
      { text },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        timeout: Number(process.env.WP_TIMEOUT_MS || 30000),
      }
    )
    const tweetId = res.data?.data?.id
    const link = tweetId ? `https://twitter.com/i/web/status/${tweetId}` : undefined
    return { data: { link } }
  } catch (error) {
    console.log('lỗi khi gửi twitter:', error.response?.status || error.code || '', JSON.stringify(error.response?.data) || error.message)
    throw error
  }
}

// Đăng bài lên Facebook Page qua Graph API (POST /{pageId}/feed).
// Credential lấy từ satellite.credentials: pageId + pageAccessToken.
const postToFacebook = async (satellite, post) => {
  // Ưu tiên Page cấu hình sẵn ở server (.env). Nếu không có thì dùng credential
  // riêng của satellite (nhập tay/OAuth). Token .env là plaintext; token lưu DB có
  // thể đã mã hoá — decrypt() trả nguyên văn nếu là plaintext nên cả 2 đều chạy.
  const pageId = process.env.FB_PAGE_ID || credValue(satellite, 'pageId')
  const token = decrypt(
    process.env.FB_PAGE_ACCESS_TOKEN || credValue(satellite, 'pageAccessToken')
  )
  if (!pageId || !token) {
    throw new Error('Thiếu FB_PAGE_ID/FB_PAGE_ACCESS_TOKEN (.env) hoặc credential của satellite')
  }

  const message = [post.title, htmlToText(post.content)].filter(Boolean).join('\n\n')

  try {
    const res = await axios.post(
      `https://graph.facebook.com/v21.0/${pageId}/feed`,
      null,
      {
        params: { message, access_token: token },
        timeout: Number(process.env.WP_TIMEOUT_MS || 30000),
      }
    )
    // Graph trả { id: "{pageId}_{postId}" } → dựng link bài viết.
    const postId = res.data?.id
    const link = postId ? `https://www.facebook.com/${postId}` : undefined
    return { data: { link } }
  } catch (error) {
    console.log('lỗi khi gửi facebook:', error.response?.status || error.code || '', error.response?.data?.error?.message || error.message)
    throw error
  }
}

// Điều phối đăng bài theo nền tảng của satellite. Mặc định (không có platform) là WordPress.
const postToSatellite = async (satellite, post) => {
  switch (satellite.platform) {
    case 'TWITTER':
      return postToTwitter(satellite, post)
    case 'FACEBOOK':
      return postToFacebook(satellite, post)
    default:
      return postToWordPress(satellite, post)
  }
}

module.exports = {
  postToSatellite,
  postToWordPress,
  postToTwitter,
  postToFacebook,
  checkSatelliteRestApi,
  errorCodeFromAxios,
}