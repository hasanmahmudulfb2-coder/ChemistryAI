// Student feedback: saved in Upstash (list "feedback") if configured, else written to Vercel logs.
const { limit, rpipe, MSG } = require("./_lib");
module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const out = (code, o) => { res.statusCode = code; res.end(JSON.stringify(o)); };
  if (req.method !== "POST") return out(405, { error: "Method not allowed" });
  let b = req.body; if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = null; } }
  const text = b && typeof b.text === "string" ? b.text.trim().slice(0, 500) : "";
  const rating = b && Number.isInteger(b.rating) && b.rating >= 1 && b.rating <= 5 ? b.rating : 0;
  if (!text && !rating) return out(400, { error: "মতামত বা রেটিং দাও।" });
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || (req.socket && req.socket.remoteAddress) || "unknown";
  const why = await limit(ip, "fb");
  if (why) return out(429, { error: MSG[why] });
  const rec = JSON.stringify({ t: new Date().toISOString(), r: rating, x: text, p: typeof b.page === "string" ? b.page.slice(0, 40) : "" });
  const ok = await rpipe([["LPUSH", "feedback", rec], ["LTRIM", "feedback", 0, 999]]);
  if (!ok) console.log("FEEDBACK", rec);
  out(200, { ok: true });
};
