// Serves the site's pages from /pages with SIMPLE SEO applied: approved title/description changes,
// the Google verification tag, and (on articles.html) the articles published by SIMPLE SEO.
// If the feed is unreachable the page is served exactly as written.
const { getFeed, readPage, send, withVerification, withOverrides, esc, plain, readMinutes, dmy, ymd } = require("./_seo");

function articleCards(feed) {
  return feed.articles.map((a) => `<a class="card a-card" href="/articles/${encodeURIComponent(a.slug)}"><div class="cov cov-seo" aria-hidden="true"><span>${esc(a.title)}</span></div>
<div class="a-meta"><time datetime="${ymd(a.published_at)}">${dmy(a.published_at)}</time><span>·</span><span>${readMinutes(a.html)} דקות קריאה</span></div><h2 style="font-size:clamp(20px,2vw,24px)">${esc(a.title)}</h2><p>${esc(a.meta_description || plain(a.html).slice(0, 160))}</p></a>`).join("");
}

module.exports = async function handler(req, res) {
  const name = String(req.query.p || "index");
  const raw = readPage(name);
  if (!raw) {
    const notFound = readPage("index");
    return send(res, 404, notFound || "Not found", "text/html; charset=utf-8", "public, s-maxage=60");
  }
  let html = raw;
  try {
    const feed = await getFeed();
    html = withOverrides(html, name === "index" ? "/" : `/${name}.html`, feed);
    if (name === "index") html = withVerification(html, feed);
    if (name === "articles" && feed.articles.length) html = html.replace('<div class="a-list">', `<div class="a-list">${articleCards(feed)}`);
  } catch (e) {
    console.error("[seo-page]", e && e.message);
    html = raw;
  }
  send(res, 200, html);
};

