// SIMPLE SEO integration (pull model).
// The site pulls its SEO content from SIMPLE SEO's public feed: new articles, approved title/description
// changes for existing pages, the Google verification tag and the IndexNow key.
// Nothing is written into this repo, and any feed failure falls back to the static page as it is.
const fs = require("fs");
const path = require("path");

const SITE = "https://primeos.co.il";
const FEED = process.env.SIMPLE_SEO_FEED || "https://seo.simple-solution.co.il/api/feed/3e20cfb3-0d2a-416f-80a0-4629dbc739d7";
const EMPTY = { articles: [], pages: [], google_verification: null, indexnow_key: null };
const PAGES = path.join(process.cwd(), "pages");

let cache = { at: 0, feed: EMPTY };
async function getFeed(fresh = false) {
  if (!fresh && Date.now() - cache.at < 60e3) return cache.feed;
  try {
    const r = await fetch(FEED, { cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (!r.ok) return fresh ? EMPTY : cache.feed;
    const j = await r.json();
    const feed = {
      articles: Array.isArray(j.articles) ? j.articles.filter((a) => a && a.slug && a.html) : [],
      pages: Array.isArray(j.pages) ? j.pages : [],
      google_verification: typeof j.google_verification === "string" ? j.google_verification : null,
      indexnow_key: typeof j.indexnow_key === "string" ? j.indexnow_key : null,
    };
    cache = { at: Date.now(), feed };
    return feed;
  } catch {
    return cache.feed;
  }
}

function readPage(name) {
  if (!/^[a-z0-9-]+$/i.test(name)) return null;
  try { return fs.readFileSync(path.join(PAGES, name + ".html"), "utf8"); } catch { return null; }
}
function readFile(name) {
  try { return fs.readFileSync(path.join(PAGES, name), "utf8"); } catch { return null; }
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const dec = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
const sameSlug = (a, b) => dec(String(a)) === dec(String(b));
const normPath = (p) => {
  let s = String(p || "/");
  try { s = new URL(s, SITE).pathname; } catch { /* keep */ }
  s = dec(s).replace(/index\.html$/, "").replace(/\/+$/, "");
  return s || "/";
};

// Title and description for one page: replaces <title>, meta description and the matching og/twitter tags.
function applyMeta(html, title, description) {
  if (title) {
    const t = esc(title);
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${t}</title>`)
      .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/i, `$1${t}$2`)
      .replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/i, `$1${t}$2`);
  }
  if (description) {
    const d = esc(description);
    html = html.replace(/(<meta\s+name="description"\s+content=")[^"]*(")/i, `$1${d}$2`)
      .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/i, `$1${d}$2`)
      .replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/i, `$1${d}$2`);
  }
  return html;
}

function withVerification(html, feed) {
  if (!feed.google_verification || html.includes('name="google-site-verification"')) return html;
  return html.replace(/<\/head>/i, `<meta name="google-site-verification" content="${esc(feed.google_verification)}">\n</head>`);
}

function withOverrides(html, pagePath, feed) {
  const want = normPath(pagePath);
  const o = feed.pages.find((p) => normPath(p.path) === want);
  return o ? applyMeta(html, o.title, o.description) : html;
}

const plain = (html) => String(html).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const readMinutes = (html) => Math.max(2, Math.round(plain(html).split(" ").length / 200));
const dmy = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`; };
const ymd = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toISOString().slice(0, 10); };
const articleUrl = (slug) => `${SITE}/articles/${encodeURIComponent(dec(slug))}`;

function send(res, status, body, type = "text/html; charset=utf-8", cache = "public, s-maxage=300, stale-while-revalidate=86400") {
  res.statusCode = status;
  res.setHeader("content-type", type);
  res.setHeader("cache-control", cache);
  res.end(body);
}

module.exports = { SITE, getFeed, readPage, readFile, esc, dec, sameSlug, normPath, applyMeta, withVerification, withOverrides, plain, readMinutes, dmy, ymd, articleUrl, send };
