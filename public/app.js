/* ChemiAI shared script: home-screen app support + feedback box */
(function () {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () {});
  var css = ".fbb{position:fixed;top:8px;right:8px;z-index:20;min-height:40px;padding:0 14px;border:1px solid var(--brand,#0f7b63);border-radius:999px;background:var(--card,#fff);color:var(--ink,#1c2b27);font:inherit;font-size:.85rem;cursor:pointer}" +
    "dialog.fbd{border:1px solid var(--line,#d8e2de);border-radius:16px;background:var(--card,#fff);color:var(--ink,#1c2b27);width:min(440px,92vw);padding:18px;font-family:inherit}dialog.fbd::backdrop{background:rgba(0,0,0,.45)}" +
    ".fbd h2{margin:0 0 8px;font-size:1.1rem}.fbd textarea{width:100%;min-height:90px;border:1px solid var(--line,#d8e2de);border-radius:10px;padding:8px;font:inherit;background:var(--bg,#f6f8f7);color:inherit;resize:vertical}" +
    ".fbs{display:flex;gap:4px;margin:6px 0}.fbs button{border:0;background:none;font-size:1.8rem;cursor:pointer;min-width:44px;min-height:44px;color:#c9d3cf}.fbs button.on{color:#f4a62a}" +
    ".fbd .row2{display:flex;gap:8px;margin-top:10px}.fbd .row2 button{min-height:44px;padding:0 18px;border-radius:10px;border:1px solid var(--brand,#0f7b63);font:inherit;cursor:pointer;background:var(--bub,#e3f3ee);color:inherit}.fbd .row2 .pr{background:var(--brand,#0f7b63);color:var(--brand-ink,#fff);font-weight:700}.fbd small{color:var(--mute,#5d6f69)}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  var rate = 0;
  var b = document.createElement("button"); b.className = "fbb"; b.type = "button"; b.textContent = "💬 মতামত"; b.setAttribute("aria-label", "মতামত দাও");
  var d = document.createElement("dialog"); d.className = "fbd"; d.setAttribute("aria-labelledby", "fbt");
  d.innerHTML = '<h2 id="fbt">💬 তোমার মতামত দাও</h2><div>সাইটটি কেমন লাগছে?</div><div class="fbs" role="group" aria-label="রেটিং"></div><textarea maxlength="500" aria-label="মতামত লেখো" placeholder="কী ভালো লেগেছে বা কী ঠিক করা দরকার? (সর্বোচ্চ ৫০০ অক্ষর)"></textarea><small>🔒 নাম, ফোন নম্বর বা ব্যক্তিগত তথ্য লিখো না।</small><div id="fbm" role="status" style="min-height:1.4em;margin-top:6px"></div><div class="row2"><button type="button" class="pr">পাঠাও</button><button type="button" class="cl">বন্ধ করো</button></div>';
  var stars = d.querySelector(".fbs");
  for (var i = 1; i <= 5; i++) (function (n) { var s = document.createElement("button"); s.type = "button"; s.textContent = "★"; s.setAttribute("aria-label", n + " স্টার"); s.onclick = function () { rate = n; [].forEach.call(stars.children, function (c, k) { c.classList.toggle("on", k < n) }) }; stars.appendChild(s) })(i);
  var msg = d.querySelector("#fbm"), ta = d.querySelector("textarea"), pr = d.querySelector(".pr");
  b.onclick = function () { msg.textContent = ""; if (d.showModal) d.showModal(); else d.setAttribute("open", "") };
  d.querySelector(".cl").onclick = function () { d.close ? d.close() : d.removeAttribute("open") };
  pr.onclick = function () {
    var t = ta.value.trim(); if (!t && !rate) { msg.textContent = "একটি রেটিং বা কয়েক লাইন মতামত দাও।"; return }
    pr.disabled = true; msg.textContent = "পাঠানো হচ্ছে…";
    fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating: rate, text: t, page: location.pathname }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || ""); }) })
      .then(function () { msg.textContent = "✅ ধন্যবাদ! তোমার মতামত পাঠানো হয়েছে।"; ta.value = ""; rate = 0; [].forEach.call(stars.children, function (c) { c.classList.remove("on") }); setTimeout(function () { d.close && d.close() }, 1600) })
      .catch(function (e) { msg.textContent = e.message || "পাঠানো যায়নি। আবার চেষ্টা করো।" })
      .then(function () { pr.disabled = false });
  };
  document.body.appendChild(b); document.body.appendChild(d);
})();
