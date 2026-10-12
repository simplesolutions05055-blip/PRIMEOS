// SIMPLE SEO publish endpoint (pull model). The content itself is read from SIMPLE SEO's feed,
// so this endpoint only confirms an article is live in the feed and returns its URL.
// It writes nothing, which is why it does not need the shared secret.
const { getFeed, sameSlug, articleUrl } = require("./_seo");

module.exports = async function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  let b = req.body || {};
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { return res.status(400).json({ error: "bad_json" }); } }
  switch (b.action) {
    case "ping":
      return res.status(200).json({ ok: true, site: "primeos" });
    case "publish_article": {
      const slug = String((b.article && b.article.slug) || "");
      if (!slug) return res.status(400).json({ error: "missing_slug" });
      const feed = await getFeed(true);
      if (!feed.articles.some((a) => sameSlug(a.slug, slug))) return res.status(404).json({ error: "not_in_feed" });
      return res.status(200).json({ url: articleUrl(slug) });
    }
    case "update_meta":
    case "set_verification":
      await getFeed(true);
      return res.status(200).json({ ok: true });
    default:
      return res.status(400).json({ error: "unknown_action" });
  }
};
