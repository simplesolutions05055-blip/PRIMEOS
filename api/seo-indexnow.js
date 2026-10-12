// /<key>.txt for IndexNow: answers only with the key SIMPLE SEO issued for this site.
const { getFeed, send } = require("./_seo");

module.exports = async function handler(req, res) {
  const key = String(req.query.key || "");
  const feed = await getFeed();
  if (!feed.indexnow_key || feed.indexnow_key !== key) return send(res, 404, "not found", "text/plain; charset=utf-8", "public, s-maxage=60");
  send(res, 200, key, "text/plain; charset=utf-8");
};
