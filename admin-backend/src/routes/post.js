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
const { generateAndPublish } = require('../app/controllers/campaignController')
const upload = require('../config/file/upload')

router.get('/', getAllPosts)
router.get('/error/:id', getErrorPost)
// AI marketing pipeline: validate -> generate -> publish to WordPress targets.
// Declared before '/:id' is irrelevant (different method), but kept grouped with POSTs.
router.post('/generate-and-publish', generateAndPublish)
router.get('/:id', getPostById)
router.post('/', upload.array("images", 10), createNewPost)
router.post('/repost/:id', repostToErrorSatellitesOnePost)
router.get('/track-progress', trackProgress)

module.exports = router