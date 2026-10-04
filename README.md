# 🔢 Universal Number System Converter

A full-stack **Universal Number System Converter** built with **Node.js + Express** and **Vanilla HTML/CSS/JS**. Convert between Binary, Octal, Decimal, and Hexadecimal instantly with detailed **step-by-step mathematical explanations**, interactive digit keyboard, conversion history, and a quick reference table.

---

## ✨ Features

- **4-Base Conversion** – Binary ↔ Octal ↔ Decimal ↔ Hexadecimal
- **Step-by-step Explanations** – See full mathematical breakdown for every conversion
- **Interactive Digit Keyboard** – Smart keyboard that disables invalid digits per base
- **Conversion History** – Click any past entry to re-run it
- **Quick Reference Table** – 0–31 in all 4 bases
- **Bit Visualizer** – Visual bit-pattern for binary results
- **Number Insights** – Bit length, byte count, power-of-2 check
- **Copy to Clipboard** – One click to copy any result
- **REST API** – JSON endpoints usable from any client
- **Violet Premium Dark UI** – Animated glowing orbs, gradient text, glassmorphism

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js · Express · CORS |
| Frontend | HTML5 · Vanilla CSS · Vanilla JS |
| Fonts | JetBrains Mono · Inter (Google Fonts) |

---

## 📦 Installation

### Prerequisites
- [Node.js](https://nodejs.org/) v14+

```bash
# 1. Clone the repo
git clone https://github.com/anishfathima200704-art/universal-number-system-converter.git
cd universal-number-system-converter

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

Open **http://localhost:3001** in your browser.

---

## 📡 API Endpoints

### `POST /api/convert`
Convert a number from one base to all other bases.

**Request:**
```json
{
  "value": "FF",
  "from": "hexadecimal"
}
```

**Response:**
```json
{
  "input": { "value": "FF", "base": "hexadecimal" },
  "decimal": 255,
  "results": {
    "binary":      "11111111",
    "octal":       "377",
    "decimal":     "255",
    "hexadecimal": "FF"
  },
  "conversions": {
    "binary": {
      "value": "11111111",
      "steps": [
        { "title": "Step 1 – Convert Hexadecimal → Decimal", "lines": ["..."] },
        { "title": "Step 2 – Convert Decimal → Binary",      "lines": ["..."] }
      ]
    }
  }
}
```

**Supported bases:** `binary`, `octal`, `decimal`, `hexadecimal`

---

### `GET /api/health`
Returns server status and uptime.

---

## 📁 Project Structure

```
universal-number-system-converter/
├── server.js          ← Express backend (API + static server)
├── package.json
├── .gitignore
├── README.md
└── public/            ← Frontend (served as static files)
    ├── index.html
    ├── style.css      ← Violet dark theme
    └── script.js
```

---

## 🌐 Deploy for Free

### Render
1. Push to GitHub
2. [render.com](https://render.com) → New Web Service → Connect repo
3. Build: `npm install` · Start: `npm start`

### Railway
```bash
railway login && railway init && railway up
```

---

## 📄 License

MIT © 2024 anishfathima200704-art
