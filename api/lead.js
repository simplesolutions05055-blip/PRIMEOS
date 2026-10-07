// Demo form -> PrimeOS CRM (simple-CRM, PrimeOS business).
// The CRM key stays on the server: set PRIMEOS_CRM_KEY in the Vercel project settings.
const CRM_URL = "https://app.simple-solution.co.il/api/n8n/lead";
const s = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const key = process.env.PRIMEOS_CRM_KEY;
  if (!key) return res.status(500).json({ ok: false, error: "missing key" });

  let b = req.body || {};
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  // honeypot: bots fill the hidden field, people never see it
  if (s(b.website, 200)) return res.status(200).json({ ok: true });

  const name = s(b.name, 120), phone = s(b.phone, 40);
  if (name.length < 2 || phone.replace(/\D/g, "").length < 9) return res.status(400).json({ ok: false });

  const lead = {
    name,
    phone,
    biz: s(b.org, 160),
    industry: "רשות מקומית",
    source: "אתר PrimeOS",
    landing_page: s(b.page, 300) || "https://primeos.co.il/#demo",
    message: ["תפקיד: " + s(b.role, 80), s(b.note, 1000) ? "מה חשוב לראות: " + s(b.note, 1000) : ""].filter(Boolean).join("\n"),
  };
  try {
    const r = await fetch(CRM_URL, { method: "POST", headers: { "content-type": "application/json", "x-api-key": key }, body: JSON.stringify(lead) });
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
  } catch {
    return res.status(502).json({ ok: false });
  }
};
