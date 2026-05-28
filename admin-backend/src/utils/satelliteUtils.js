const Satellite = require("../app/models/Satellite");

async function convertErrorSatelliteToUrls(post) {
  const errorSatIds = post.errorSatellite.map(err => err.satelliteId);
  const satellites = await Satellite.find({ _id: { $in: errorSatIds } }).select('url _id');

  const idToUrlMap = {};
  satellites.forEach(sat => {
    idToUrlMap[sat._id.toString()] = sat.url;
  });

  const errorSatelliteWithUrl = post.errorSatellite
    .map(err => {
      const url = idToUrlMap[err.satelliteId.toString()];
      return url ? { url, errorCode: err.errorCode } : null;
    })
    .filter(item => item !== null);

  return {
    ...post.toObject(),
    errorSatellite: errorSatelliteWithUrl
  };
}

module.exports = { convertErrorSatelliteToUrls };