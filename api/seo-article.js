// /articles/<slug>: an article published by SIMPLE SEO, rendered in the site's own design
// (header, footer and article layout are taken from an existing article page in /pages).
const { SITE, getFeed, readPage, send, esc, sameSlug, plain, readMinutes, dmy, ymd, articleUrl, applyMeta } = require("./_seo");

const TEMPLATE = "municipal-event-promotion";

// Links in the template are relative to the site root; under /articles/ they must be absolute.
const absolutize = (html) => html.replace(/\b(href|src)="(?!\/|#|https?:|mailto:|tel:|data:)([^"]*)"/g, '$1="/$2"');

function withHeadingIds(html) {
  const toc = [];
  let n = 0;
  const out = html.replace(/<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/g, (_m, lvl, _attrs, inner) => {
    const id = "s" + ++n;
    if (lvl === "2") toc.push({ id, text: plain(inner) });
    return `<h${lvl} id="${id}">${inner}</h${lvl}>`;
  });
  return { html: out, toc };
}

function render(tpl, a, others) {
  const url = articleUrl(a.slug);
  const title = a.seo_title || a.title;
  const desc = a.meta_description || plain(a.html).slice(0, 155);
  const { html: body, toc } = withHeadingIds(a.html);

  let head = tpl.slice(0, tpl.indexOf("</head>"));
  head = head.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  head = applyMeta(head, `${title} | PrimeOS`, desc);
  head = head.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<link rel="alternate" hreflang="he-IL" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="article:published_time" content=")[^"]*(")/, `$1${ymd(a.published_at)}$2`)
    .replace(/(<meta property="article:modified_time" content=")[^"]*(")/, `$1${ymd(a.updated_at || a.published_at)}$2`);
  const crumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "בית", item: SITE + "/" },
    { "@type": "ListItem", position: 2, name: "מאמרים", item: SITE + "/articles.html" },
    { "@type": "ListItem", position: 3, name: a.title, item: url },
  ] };
  const json = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
  head += `<script type="application/ld+json">${json(crumbs)}</script>\n`;
  if (a.schema) head += `<script type="application/ld+json">${json(a.schema)}</script>\n`;

  const bodyStart = tpl.indexOf("<body>");
  const mainStart = tpl.indexOf('<main id="main">');
  const mainEnd = tpl.lastIndexOf("</main>");
  const header = absolutize(tpl.slice(bodyStart, mainStart)).replace(' aria-current="page"', "");
  const footer = absolutize(tpl.slice(mainEnd + "</main>".length));

  const tocHtml = toc.length ? `<div class="card"><h3>בכתבה</h3><ol>${toc.map((t) => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join("")}</ol></div>` : "";
  const moreHtml = others.length ? `<div class="card"><h3>עוד מאמרים</h3><ol>${others.map((o) => `<li><a href="${esc(o.href)}">${esc(o.title)}</a></li>`).join("")}</ol></div>` : "";
  const main = `<main id="main">
<section class="phead"><div class="wrap"><nav aria-label="פירורי לחם"><ol class="crumbs"><li><a href="/index.html">בית</a></li><li><a href="/articles.html">מאמרים</a></li><li aria-current="page">${esc(a.title)}</li></ol></nav><h1>${esc(a.title)}</h1><p class="lead">${esc(desc)}</p><div class="a-meta" style="margin-top:12px"><span>צוות PrimeOS</span><span>·</span><time datetime="${ymd(a.published_at)}">${dmy(a.published_at)}</time><span>·</span><span>${readMinutes(a.html)} דקות קריאה</span></div></div></section>
<section class="sec-tight" style="padding-top:8px"><div class="wrap article">
<article class="prose">${body}</article>
<aside class="side">${tocHtml}${moreHtml}<div class="card"><h3>רוצים לראות איך זה עובד?</h3><p class="muted" style="font-size:15px;margin-bottom:12px">הדגמה של PrimeOS עם המבנה של הארגון שלכם.</p><a class="btn btn-primary" href="/index.html#demo" style="width:100%">תיאום הדגמה</a></div></aside>
</div></section>
</main>`;
  return `${absolutize(head)}</head>\n${header}${main}${footer}`;
}

// Static articles already on the site, for the "more articles" box.
const STATIC = [
  { href: "/municipal-social-media-management.html", title: "ניהול רשתות חברתיות לעירייה ולרשות מקומית: המדריך המלא" },
  { href: "/content-approval-workflow-public-sector.html", title: "תהליך אישור תוכן ברשות מקומית: איך בונים היררכיית פרסום" },
  { href: "/ai-in-municipal-communication.html", title: "בינה מלאכותית בדוברות של רשות מקומית: איך משתמשים באחריות" },
];

module.exports = async function handler(req, res) {
  const slug = String(req.query.slug || "");
  const feed = await getFeed();
  const a = feed.articles.find((x) => sameSlug(x.slug, slug));
  const tpl = readPage(TEMPLATE);
  if (!a || !tpl) {
    const page = `<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><meta name="robots" content="noindex"><title>המאמר לא נמצא | PrimeOS</title><body style="font-family:sans-serif;padding:40px;text-align:center"><h1>המאמר לא נמצא</h1><p><a href="/articles.html">לכל המאמרים</a></p></body></html>`;
    return send(res, 404, page, "text/html; charset=utf-8", "public, s-maxage=30");
  }
  const others = [
    ...feed.articles.filter((x) => x !== a).slice(0, 3).map((x) => ({ href: `/articles/${encodeURIComponent(x.slug)}`, title: x.title })),
    ...STATIC,
  ].slice(0, 4);
  send(res, 200, render(tpl, a, others));
};

module.exports.render = render;
