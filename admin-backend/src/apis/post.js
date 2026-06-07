const axios = require('axios')
const { createBasicAuthHeader } = require('../utils/apiUtils')


const postToSatellite = async (satellite, post) => {
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

module.exports = { postToSatellite }