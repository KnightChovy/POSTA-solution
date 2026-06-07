require("dotenv").config();

/**
 * WordPress site registry.
 *
 * The new "generate-and-publish" pipeline references WordPress targets by a
 * logical name (e.g. "main", "secondary") instead of a DB satellite record.
 * Credentials are resolved from environment variables so nothing is hardcoded.
 *
 * Two ways to configure a site:
 *  1. Built-in aliases that reuse the project's existing .env keys:
 *       main      -> WP_URL / WP_USERNAME / WP_PASSWORD
 *       secondary -> APP_URL / APP_USERNAME / APP_PASSWORD
 *  2. Generic pattern for any extra site (no code change required):
 *       WP_SITE_<NAME>_URL / WP_SITE_<NAME>_USERNAME / WP_SITE_<NAME>_PASSWORD
 *     e.g. wordpressSite "blog" -> WP_SITE_BLOG_URL / ..._USERNAME / ..._PASSWORD
 */

const STATIC_SITES = {
  main: {
    url: process.env.WP_URL,
    username: process.env.WP_USERNAME,
    password: process.env.WP_PASSWORD,
  },
  secondary: {
    url: process.env.APP_URL,
    username: process.env.APP_USERNAME,
    password: process.env.APP_PASSWORD,
  },
};

const normalizeUrl = (url) =>
  url
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\n/g, "")
    .replace(/\/+$/, "");

/**
 * Resolve credentials for a logical WordPress site name.
 * Throws a clear error if the site is not configured so the caller can mark
 * just that target as failed (and keep publishing to the others).
 */
const getWordPressSite = (name) => {
  if (!name) {
    throw new Error("Missing wordpressSite name");
  }

  let site = STATIC_SITES[name];

  // Fallback to the generic WP_SITE_<NAME>_* convention.
  if (!site || !site.url) {
    const prefix = `WP_SITE_${String(name).toUpperCase()}`;
    site = {
      url: process.env[`${prefix}_URL`],
      username: process.env[`${prefix}_USERNAME`],
      password: process.env[`${prefix}_PASSWORD`],
    };
  }

  const missing = ["url", "username", "password"].filter((k) => !site[k]);
  if (missing.length) {
    throw new Error(
      `WordPress site "${name}" is not configured (missing env: ${missing.join(", ")})`
    );
  }

  return {
    name,
    url: normalizeUrl(site.url),
    username: site.username,
    password: site.password,
  };
};

module.exports = { getWordPressSite };
