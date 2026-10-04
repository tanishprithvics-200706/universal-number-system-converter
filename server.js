const express = require("express");
const cors    = require("cors");
const path    = require("path");
const os      = require("os");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── Helpers ──────────────────────────────────────────────────────────────────

const BASES = { binary: 2, octal: 8, decimal: 10, hexadecimal: 16 };
const BASE_DIGITS = "0123456789ABCDEF";

function parseNumber(value, base) {
  const n = parseInt(value.toString().toUpperCase(), base);
  if (isNaN(n) || n < 0) throw new Error("Invalid number for given base");
  return n;
}

// Generate step-by-step conversion explanation
function buildSteps(value, fromBase, toBase, decimal) {
  const steps = [];

  // ── Step 1: Convert input → decimal ──────────────────────────────────────
  if (fromBase !== 10) {
    const digits = value.toString().toUpperCase().split("").reverse();
    steps.push({
      title: `Step 1 – Convert ${fromBaseName(fromBase)} → Decimal`,
      lines: buildToDecimalLines(digits, fromBase, decimal),
    });
  } else {
    steps.push({
      title: "Step 1 – Input is already Decimal",
      lines: [`Value = ${decimal}`],
    });
  }

  // ── Step 2: Convert decimal → target ─────────────────────────────────────
  if (toBase !== 10) {
    steps.push({
      title: `Step 2 – Convert Decimal → ${fromBaseName(toBase)}`,
      lines: buildFromDecimalLines(decimal, toBase),
    });
  } else {
    steps.push({
      title: "Step 2 – Target is Decimal – Already done!",
      lines: [`Result = ${decimal}`],
    });
  }

  return steps;
}

function fromBaseName(base) {
  return { 2: "Binary", 8: "Octal", 10: "Decimal", 16: "Hexadecimal" }[base] || `Base-${base}`;
}

function buildToDecimalLines(revDigits, base, decimal) {
  const lines = [];
  const terms = revDigits.map((d, i) => `${d} × ${base}^${i}`);
  lines.push("Formula: Σ (digit × base^position)");
  lines.push(terms.reverse().join(" + "));

  // Evaluate each term
  const evals = revDigits.map((d, i) => {
    const v = parseInt(d, 16) * Math.pow(base, i);
    return `${d} × ${Math.pow(base, i)} = ${v}`;
  });
  evals.reverse().forEach(l => lines.push(l));
  lines.push(`Total = ${decimal}`);
  return lines;
}

function buildFromDecimalLines(decimal, base) {
  if (decimal === 0) return ["0 ÷ " + base + " = 0 R 0", "Result = 0"];
  const lines = [];
  lines.push(`Divide ${decimal} repeatedly by ${base}, collect remainders:`);
  let n = decimal;
  const remainders = [];
  while (n > 0) {
    const q = Math.floor(n / base);
    const r = n % base;
    lines.push(`${n} ÷ ${base} = ${q}  remainder ${BASE_DIGITS[r]}`);
    remainders.push(BASE_DIGITS[r]);
    n = q;
  }
  lines.push(`Read remainders bottom-up: ${remainders.reverse().join("")}`);
  return lines;
}

// ── Routes ────────────────────────────────────────────────────────────────────

/* POST /api/convert */
app.post("/api/convert", (req, res) => {
  const { value, from } = req.body;
  if (!value || !from || !BASES[from.toLowerCase()]) {
    return res.status(400).json({ error: "Provide value and a valid 'from' base (binary/octal/decimal/hexadecimal)" });
  }

  try {
    const fromBase = BASES[from.toLowerCase()];
    const decimal  = parseNumber(value, fromBase);

    // All representations
    const results = {
      binary:      decimal.toString(2),
      octal:       decimal.toString(8),
      decimal:     decimal.toString(10),
      hexadecimal: decimal.toString(16).toUpperCase(),
    };

    // Steps for every target base (except same as source)
    const conversions = {};
    for (const [name, base] of Object.entries(BASES)) {
      conversions[name] = {
        value: results[name],
        steps: buildSteps(value, fromBase, base, decimal),
      };
    }

    res.json({
      input:       { value, base: from },
      decimal,
      results,
      conversions,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/* GET /api/history (in-memory, resets on restart) */
const history = [];
app.post("/api/history/add", (req, res) => {
  const { entry } = req.body;
  if (entry) {
    history.unshift(entry);
    if (history.length > 20) history.pop();
  }
  res.json({ ok: true });
});
app.get("/api/history", (_req, res) => res.json({ history }));

/* GET /api/health */
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", uptime: process.uptime() }));

// ── Serve frontend ─────────────────────────────────────────────────────────
app.get("/{*path}", (_req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, "0.0.0.0", () => {
  const nets = os.networkInterfaces();
  let localIP = "localhost";
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) localIP = net.address;
    }
  }
  console.log(`✅ Universal Number Converter running!`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${localIP}:${PORT}`);
});

module.exports = app;
