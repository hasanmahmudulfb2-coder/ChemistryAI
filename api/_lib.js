// Shared helpers: rate limiting (Upstash Redis if configured, else in-memory).
const LIM = { chat: { min: 4, day: 20 }, quiz: { min: 2, day: 8 } };
const GLOBAL = Number(process.env.GLOBAL_DAILY_LIMIT || 300);
const U = process.env.UPSTASH_REDIS_REST_URL, T = process.env.UPSTASH_REDIS_REST_TOKEN;
const mem = globalThis.__mem || (globalThis.__mem = new Map());

async function incr(keys, ttl) {
  if (U && T) {
    try {
      const r = await fetch(U.replace(/\/$/, "") + "/pipeline", {
        method: "POST",
        headers: { Authorization: "Bearer " + T, "content-type": "application/json" },
        body: JSON.stringify(keys.flatMap((k, i) => [["INCR", k], ["EXPIRE", k, ttl[i]]])),
      });
      const j = await r.json();
      if (Array.isArray(j) && j.length === keys.length * 2 && j.every(x => !x.error)) return keys.map((_, i) => Number(j[i * 2].result));
      console.error("Upstash unexpected reply", JSON.stringify(j).slice(0, 200));
    } catch (e) { console.error("Upstash error", e.message); }
  }
  const now = Date.now();
  for (const [k, v] of mem) if (v.exp < now) mem.delete(k);
  return keys.map((k, i) => {
    const v = mem.get(k) || { n: 0, exp: now + ttl[i] * 1000 };
    v.n++; mem.set(k, v); return v.n;
  });
}

// returns null if allowed, else "minute" | "day" | "global"
async function limit(ip, kind) {
  const L = LIM[kind], day = new Date().toISOString().slice(0, 10), minute = Math.floor(Date.now() / 60000);
  const n = await incr([`cm:${kind}:${ip}:${minute}`, `cd:${kind}:${ip}:${day}`, `cg:${day}`], [90, 90000, 90000]);
  if (n[2] > GLOBAL) return "global";
  if (n[0] > L.min) return "minute";
  if (n[1] > L.day) return "day";
  return null;
}
const MSG = {
  global: "আজকের মতো সেবা সীমা শেষ। কাল আবার চেষ্টা করো।",
  minute: "তুমি অনেক দ্রুত অনুরোধ করছ। একটু অপেক্ষা করে আবার চেষ্টা করো।",
  day: "আজকের জন্য তোমার সীমা শেষ। কাল আবার চেষ্টা করো।",
};
module.exports = { limit, MSG };
