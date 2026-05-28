const express = require('express')
const router = express.Router()
const {
  getAllPosts,
  createNewPost,
  trackProgress,
  repostToErrorSatellitesOnePost,
  getPostById,
  getErrorPost
} = require('../app/controllers/postController')
const upload = require('../config/file/upload')

router.get('/', getAllPosts)
router.get('/error/:id', getErrorPost)
router.get('/:id', getPostById)
router.post('/', upload.array("images", 10), createNewPost)
router.post('/repost/:id', repostToErrorSatellitesOnePost)
router.get('/track-progress', trackProgress)

module.exports = router