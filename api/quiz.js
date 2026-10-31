// AI practice questions: generates new MCQs from the textbook notes of one chapter.
const NOTES = require("./notes");
const { limit, MSG } = require("./_lib");
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

function valid(arr) {
  if (!Array.isArray(arr)) return null;
  const out = [];
  for (const x of arr) {
    if (!x || typeof x.q !== "string" || !Array.isArray(x.o) || x.o.length !== 4 || !Number.isInteger(x.a) || x.a < 0 || x.a > 3 || typeof x.e !== "string") continue;
    const o = x.o.map(s => String(s).trim().slice(0, 160));
    if (new Set(o).size !== 4 || o.some(s => !s)) continue;
    out.push([x.q.trim().slice(0, 400), o, x.a, x.e.trim().slice(0, 500)]);
  }
  return out.length >= 3 ? out.slice(0, 6) : null;
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const fail = (code, msg) => { res.statusCode = code; res.end(JSON.stringify({ error: msg })); };
  if (req.method !== "POST") return fail(405, "Method not allowed");
  if (!process.env.GEMINI_API_KEY) return fail(500, "Server not configured");
  let body = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  const notes = body && NOTES[body.chapter];
  if (!notes) return fail(400, "অধ্যায় পাওয়া যায়নি।");
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || (req.socket && req.socket.remoteAddress) || "unknown";
  const why = await limit(ip, "quiz");
  if (why) return fail(429, MSG[why]);

  const prompt = `তুমি বাংলাদেশের SSC রসায়ন শিক্ষক। নিচের পাঠ্যবইয়ের নোট থেকে ৫টি নতুন বহুনির্বাচনি প্রশ্ন (MCQ) তৈরি করো।
নিয়ম: (১) শুধু নোটে থাকা তথ্য ব্যবহার করো, নিজে কিছু যোগ করো না। (২) প্রতিটি প্রশ্নে ঠিক ৪টি আলাদা অপশন, ঠিক একটি সঠিক। (৩) ভাষা সহজ বাংলা; রাসায়নিক সংকেত ইউনিকোডে (H₂O, CO₂, →) লেখো, LaTeX বা $ ব্যবহার করো না। (৪) ব্যাখ্যা (e) ১-২ বাক্যে এবং নোটের তথ্য থেকে; নোটে পৃষ্ঠা বা অনুচ্ছেদ নম্বর থাকলেই শুধু তা উল্লেখ করো। (৫) প্রশ্নগুলো বিভিন্ন বিষয়ের ও বিভিন্ন কঠিনতার হোক। (৬) সঠিক উত্তরের অবস্থান (a) এলোমেলো রাখো।
শুধু JSON অ্যারে দাও, অন্য কিছু নয়: [{"q":"প্রশ্ন","o":["ক","খ","গ","ঘ"],"a":সঠিক অপশনের ইনডেক্স 0-3,"e":"ব্যাখ্যা"}]

নোট:
${notes}`;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 3000, temperature: 0.7, responseMimeType: "application/json" } }),
    });
    if (!r.ok) { console.error("Gemini quiz error", r.status, await r.text().catch(() => "")); return fail(r.status === 429 ? 429 : 502, r.status === 429 ? "এখন অনেক শিক্ষার্থী ব্যবহার করছে। একটু পরে চেষ্টা করো।" : "প্রশ্ন তৈরি করা যায়নি। আবার চেষ্টা করো।"); }
    const j = await r.json();
    let t = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).filter(p => p.text && !p.thought).map(p => p.text).join("");
    t = t.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    let qs = null; try { qs = valid(JSON.parse(t)); } catch {}
    if (!qs) return fail(502, "প্রশ্ন তৈরি করা যায়নি। আবার চেষ্টা করো।");
    res.statusCode = 200; res.end(JSON.stringify({ questions: qs }));
  } catch (e) { console.error(e); fail(502, "প্রশ্ন তৈরি করা যায়নি। আবার চেষ্টা করো।"); }
};
