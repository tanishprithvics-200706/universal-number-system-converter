/* ══════════════════════════════════════════════
   Universal Number System Converter – script.js
   ══════════════════════════════════════════════ */

const API = "";
let selectedBase = "decimal";
let lastResult   = null;
const BASES = ["binary","octal","decimal","hexadecimal"];
const ALLOWED = {
  binary:      /^[01]+$/,
  octal:       /^[0-7]+$/,
  decimal:     /^[0-9]+$/,
  hexadecimal: /^[0-9a-fA-F]+$/,
};
const BASE_LABEL = { binary:"Binary", octal:"Octal", decimal:"Decimal", hexadecimal:"Hexadecimal" };

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  checkHealth();
  bindBasePicker();
  bindKeyboard();
  bindInput();
  bindConvert();
  bindCopy();
  bindStepsToggles();
  buildRefTable();
  bindHistory();
});

// ── API Health ────────────────────────────────────────────────────────────────
async function checkHealth() {
  const el = document.getElementById("apiStatus");
  try {
    const r = await fetch("/api/health");
    if (!r.ok) throw new Error();
    el.innerHTML = `<span class="dot"></span><span>API Online</span>`;
    el.className = "api-status";
  } catch {
    el.innerHTML = `<span class="dot"></span><span>API Offline</span>`;
    el.className = "api-status error";
  }
}

// ── Base Picker ───────────────────────────────────────────────────────────────
function bindBasePicker() {
  document.querySelectorAll(".base-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".base-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedBase = btn.dataset.base;
      validateInput();
      updateKeyboard();
    });
  });
}

function updateKeyboard() {
  const isBin = selectedBase === "binary";
  const isOct = selectedBase === "octal";
  const isDec = selectedBase === "decimal";
  const isHex = selectedBase === "hexadecimal";

  document.querySelectorAll(".dk-btn").forEach(btn => {
    const d = btn.dataset.digit;
    if (d === "DEL") { btn.disabled = false; return; }
    const num = parseInt(d, 16);
    let allowed = true;
    if (isBin) allowed = d === "0" || d === "1";
    else if (isOct) allowed = num >= 0 && num <= 7;
    else if (isDec) allowed = num >= 0 && num <= 9;
    // hex – all allowed
    btn.disabled = !allowed;
  });
}

// ── Digit Keyboard ────────────────────────────────────────────────────────────
function bindKeyboard() {
  document.querySelectorAll(".dk-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const inp = document.getElementById("inputValue");
      const d = btn.dataset.digit;
      if (d === "DEL") {
        inp.value = inp.value.slice(0,-1);
      } else {
        inp.value += d;
      }
      validateInput();
      inp.focus();
    });
  });
}

// ── Input validation ──────────────────────────────────────────────────────────
function bindInput() {
  const inp = document.getElementById("inputValue");
  inp.addEventListener("input", () => validateInput());
  inp.addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("convertBtn").click();
  });
  document.getElementById("clearBtn").addEventListener("click", () => {
    inp.value = "";
    inp.classList.remove("error");
    document.getElementById("validationMsg").textContent = "";
  });
}

function validateInput() {
  const val = document.getElementById("inputValue").value.trim();
  const msg = document.getElementById("validationMsg");
  const inp = document.getElementById("inputValue");
  if (!val) { inp.classList.remove("error"); msg.textContent = ""; return true; }
  if (!ALLOWED[selectedBase].test(val)) {
    inp.classList.add("error");
    msg.textContent = `⚠ Invalid character for ${BASE_LABEL[selectedBase]}`;
    return false;
  }
  inp.classList.remove("error");
  msg.textContent = "";
  return true;
}

// ── Convert ───────────────────────────────────────────────────────────────────
function bindConvert() {
  document.getElementById("convertBtn").addEventListener("click", doConvert);
}

async function doConvert() {
  const value = document.getElementById("inputValue").value.trim().toUpperCase();
  if (!value) { showToast("⚠ Please enter a number"); return; }
  if (!validateInput()) { showToast("⚠ Invalid input for selected base"); return; }

  const btn = document.getElementById("convertBtn");
  btn.disabled = true; btn.textContent = "Converting…";

  try {
    const res  = await fetch("/api/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value, from: selectedBase }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(`❌ ${data.error}`); return; }

    lastResult = data;
    renderResults(data);
    addHistory({ value, from: selectedBase, decimal: data.decimal });
  } catch {
    showToast("❌ Network error – is the server running?");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Convert`;
  }
}

// ── Render Results ────────────────────────────────────────────────────────────
function renderResults(data) {
  document.getElementById("resultsSection").style.display = "flex";

  BASES.forEach(base => {
    const card = document.getElementById(`card-${base}`);
    // Mark source card
    card.classList.toggle("source-card", base === selectedBase);
    let badge = card.querySelector(".source-badge");
    if (base === selectedBase) {
      if (!badge) {
        badge = document.createElement("div");
        badge.className = "source-badge";
        badge.textContent = "INPUT";
        card.appendChild(badge);
      }
    } else {
      if (badge) badge.remove();
    }

    // Value
    document.getElementById(`val-${base}`).textContent = data.results[base];

    // Bit visualizer (binary only)
    const bvEl = document.getElementById(`bits-${base}`);
    if (base === "binary" && bvEl) {
      bvEl.innerHTML = "";
      for (const ch of data.results.binary) {
        const span = document.createElement("span");
        span.className = ch === "1" ? "bv bv-1" : "bv bv-0";
        span.textContent = ch;
        bvEl.appendChild(span);
      }
      bvEl.style.display = "";
    } else if (bvEl) {
      bvEl.style.display = "none";
    }

    // Steps
    const stepsBox = document.getElementById(`steps-${base}`);
    stepsBox.innerHTML = "";
    const conv = data.conversions[base];
    if (conv && conv.steps) {
      conv.steps.forEach(s => {
        const block = document.createElement("div");
        block.className = "step-block";
        block.innerHTML = `<div class="step-title">${s.title}</div>
          <div class="step-lines">${s.lines.map(l => `<div class="step-line">${escapeHtml(l)}</div>`).join("")}</div>`;
        stepsBox.appendChild(block);
      });
    }
  });

  // Info bar
  const d = data.decimal;
  const binStr = data.results.binary;
  document.getElementById("infoDecimal").textContent = d;
  document.getElementById("infoBits").textContent    = binStr.length + " bits";
  document.getElementById("infoBytes").textContent   = (Math.ceil(binStr.length / 8)) + " byte(s)";
  document.getElementById("infoPow2").textContent    = (d > 0 && (d & (d-1)) === 0) ? "✅ Yes" : "❌ No";

  // Scroll to results
  document.getElementById("resultsSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

function escapeHtml(str) {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ── Copy ──────────────────────────────────────────────────────────────────────
function bindCopy() {
  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const el = document.getElementById(btn.dataset.target);
      if (!el || el.textContent === "—") return;
      navigator.clipboard.writeText(el.textContent).then(() => showToast("✅ Copied to clipboard!"));
    });
  });
}

// ── Steps Toggles ─────────────────────────────────────────────────────────────
function bindStepsToggles() {
  document.querySelectorAll(".steps-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      const open   = !target.classList.contains("hidden");
      target.classList.toggle("hidden");
      btn.textContent = open ? "Show Steps ▾" : "Hide Steps ▴";
      btn.classList.toggle("open", !open);
    });
  });
}

// ── History ───────────────────────────────────────────────────────────────────
let localHistory = [];

function addHistory(entry) {
  localHistory.unshift(entry);
  if (localHistory.length > 15) localHistory.pop();
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("historyList");
  if (!localHistory.length) {
    list.innerHTML = `<p class="empty-history">No conversions yet. Enter a number above!</p>`;
    return;
  }
  list.innerHTML = "";
  localHistory.forEach(e => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <span class="hi-input">${e.value}</span>
      <span class="hi-from">${BASE_LABEL[e.from]}</span>
      <span class="hi-arrow">→</span>
      <span class="hi-dec">Dec: ${e.decimal}</span>`;
    item.addEventListener("click", () => {
      document.getElementById("inputValue").value = e.value;
      document.querySelectorAll(".base-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.base === e.from);
      });
      selectedBase = e.from;
      updateKeyboard();
      document.getElementById("convertBtn").click();
    });
    list.appendChild(item);
  });
}

function bindHistory() {
  document.getElementById("clearHistory").addEventListener("click", () => {
    localHistory = [];
    renderHistory();
  });
}

// ── Reference Table ──────────────────────────────────────────────────────────
function buildRefTable() {
  const table = document.getElementById("refTable");
  const head  = document.createElement("thead");
  head.innerHTML = `<tr><th>Binary</th><th>Octal</th><th>Decimal</th><th>Hexadecimal</th></tr>`;
  table.appendChild(head);
  const body = document.createElement("tbody");
  for (let i = 0; i <= 31; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i.toString(2).padStart(5,"0")}</td>
      <td>${i.toString(8)}</td>
      <td>${i}</td>
      <td>${i.toString(16).toUpperCase()}</td>`;
    body.appendChild(tr);
  }
  table.appendChild(body);
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}
