const jwt = require('jsonwebtoken')
const authenticateJWT = async (req, res, next) => {
  try {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'No token provided. Please log in.' })
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid token' })
      }
      const { id, username } = decoded
      req.id = id
      req.username = username
      req.token = token
      next()
    });

  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }

}

module.exports = authenticateJWT