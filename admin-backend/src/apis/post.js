const axios = require('axios')
const { createBasicAuthHeader } = require('../utils/apiUtils')


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

module.exports = { postToSatellite }