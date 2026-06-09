const satellite = require("./satellite");
const category = require("./category");
const login = require("./login");
const image = require("./image");
const post = require("./post");
const social = require("./social");
function routes(app) {
  app.use("/api/satellite", satellite);
  app.use("/api/category", category);
  app.use('/api/auth/login', login)
  app.use("/api/image", image);
  app.use("/api/post", post);
  app.use("/api/social", social);
}

module.exports = routes;
