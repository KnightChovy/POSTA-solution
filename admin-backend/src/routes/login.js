const express = require('express')
const router = express.Router()
const { login } = require('../app/controllers/loginController')

router.post('/', login)

module.exports = router