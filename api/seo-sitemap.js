// /sitemap.xml: the static pages (pages/sitemap.xml) plus every article published by SIMPLE SEO.
const { getFeed, readFile, send, esc, ymd, articleUrl } = require("./_seo");

module.exports = async function handler(req, res) {
  const base = readFile("sitemap.xml") || '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>';
  let xml = base;
  try {
    const feed = await getFeed();
    const rows = feed.articles.map((a) => `<url><loc>${esc(articleUrl(a.slug))}</loc><lastmod>${ymd(a.updated_at || a.published_at)}</lastmod><priority>0.6</priority></url>`).join("\n");
    if (rows) xml = base.replace("</urlset>", rows + "\n</urlset>");
  } catch { xml = base; }
  send(res, 200, xml, "application/xml; charset=utf-8", "public, s-maxage=600, stale-while-revalidate=86400");
};
