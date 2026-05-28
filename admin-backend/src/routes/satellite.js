const express = require('express')
const router = express.Router()
const {
  addSatellite,
  getNumberOfPublishedPosts,
  getNumberOfErrorPosts,
  getOverallProgress,
  getAllSatellites,
  updateSatellite,
  deleteSatellite
} = require('../app/controllers/satelliteController')

router.post('/', addSatellite)
router.get('/', getAllSatellites)
router.patch('/:id', updateSatellite)
router.delete('/:id', deleteSatellite)
router.get('/published-posts', getNumberOfPublishedPosts)
router.get('/error-posts', getNumberOfErrorPosts)
router.get('/overall-progress', getOverallProgress)

module.exports = router