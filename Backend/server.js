
// DogeSteps Backend - Single User - PIN Auth - Wallet - Withdraw

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// ---------------- CONFIG ----------------
const CONFIG = {
  PIN: "1234",
  PORT: process.env.PORT || 4000,
  DOGE_ADDRESS_LENGTH: 34
};

// ---------------- DATABASE ----------------
const DB_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Garantir diretório
fs.mkdirSync(DB_DIR, { recursive: true });

function ensureDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = {
      app: {
        steps: 0,
        doge: 0,
        walletAddress: null,
        withdrawals: []
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
  }
}

function readDB() {
  ensureDB();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function toDoge(n) {
  return Math.round(Number(n) * 10000) / 10000;
}

// ---------------- WALLET ----------------
const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function generateDogeAddress() {
  let addr = "D";
  const bytes = crypto.randomBytes(CONFIG.DOGE_ADDRESS_LENGTH - 1);
  for (let i = 0; i < bytes.length; i++) {
    addr += BASE58[bytes[i] % BASE58.length];
  }
  return addr;
}

// ---------------- ROUTES ----------------

// Test route
app.get("/", (req, res) => {
  res.json({ message: "DogeSteps backend online" });
});

// LOGIN POR PIN
app.post("/api/auth", (req, res) => {
  const { pin } = req.body || {};
  if (String(pin) === CONFIG.PIN) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false });
});

// STATUS INICIAL
app.get("/api/status", (req, res) => {
  const db = readDB();
  res.json({
    steps: db.app.steps,
    doge: toDoge(db.app.doge),
    wallet: db.app.walletAddress
  });
});

// UPDATE DE PASSOS + DOGE
app.post("/api/steps", (req, res) => {
  const { steps, doge, delta } = req.body || {};
  const db = readDB();

  if (steps > db.app.steps) db.app.steps = steps;
  if (doge > db.app.doge) db.app.doge = doge;

  if (delta) {
    db.app.steps += delta;
    db.app.doge = toDoge(db.app.doge + delta);
  }

  writeDB(db);

  res.json({
    steps: db.app.steps,
    doge: toDoge(db.app.doge)
  });
});

// CRIAR CARTEIRA
app.post("/api/wallet", (req, res) => {
  const db = readDB();
  const newAddr = generateDogeAddress();
  db.app.walletAddress = newAddr;
  writeDB(db);
  res.json({ address: newAddr });
});

// LEVANTAMENTO
app.post("/api/withdraw", (req, res) => {
  const { address, amount } = req.body || {};
  const db = readDB();

  if (!address || !amount) {
    return res.status(400).json({ ok: false, message: "Dados inválidos" });
  }

  const amt = Number(amount);

  if (amt <= 0) {
    return res.status(400).json({ ok: false, message: "Valor inválido" });
  }

  if (amt > db.app.doge) {
    return res.status(400).json({ ok: false, message: "Saldo insuficiente" });
  }

  // descontar
  db.app.doge = toDoge(db.app.doge - amt);

  // registrar pedido
  db.app.withdrawals.push({
    address,
    amount: amt,
    ts: new Date().toISOString(),
    status: "pending"
  });

  writeDB(db);

  res.json({ ok: true, newBalance: db.app.doge });
});

// ---------------- START ----------------
app.listen(CONFIG.PORT, () => {
  console.log("Backend DogeSteps iniciado na porta " + CONFIG.PORT);
});
