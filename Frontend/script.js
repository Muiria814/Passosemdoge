// script.js PRO - integrado com backend + sync offline
// Backend base URL (fornecido pelo utilizador)
const API_URL = "https://backend-doge-1.onrender.com";

// PIN local não é mais usado aqui
// const LOCAL_PIN = "1234";

// --- Estado local ---
let steps = parseInt(localStorage.getItem("steps") || "0");
let doge = parseInt(localStorage.getItem("doge") || "0");
let wallet = localStorage.getItem("wallet") || "Sem endereço";
let loggedIn = localStorage.getItem("loggedIn") === "true";

// outbox para operações pendentes quando offline
let outbox = JSON.parse(localStorage.getItem("outbox") || "[]");

// util: guarda estado no localStorage
function persistLocalState() {
    localStorage.setItem("steps", steps);
    localStorage.setItem("doge", doge);
    localStorage.setItem("wallet", wallet);
    localStorage.setItem("outbox", JSON.stringify(outbox));
    localStorage.setItem("loggedIn", loggedIn ? "true" : "false");
}

// --- Render UI ---
function render() {
    const elSteps = document.getElementById("steps");
    const elDoge = document.getElementById("doge");
    const elWallet = document.getElementById("walletAddress");
    if (elSteps) elSteps.textContent = steps;
    if (elDoge) elDoge.textContent = doge;
    if (elWallet) elWallet.textContent = wallet;
}

// --- Queue / Outbox helpers ---
function queueOp(item) {
    outbox.push(item);
    persistLocalState();
}

// envia um item ao backend
async function flushOutboxOnce() {
    if (!navigator.onLine) return;
    if (outbox.length === 0) return;

    const pending = outbox.slice();
    const newOutbox = [];

    for (const item of pending) {
        try {
            if (item.type === "steps") {
                await fetch(`${API_URL}/api/steps`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(item.payload),
                });
            } else if (item.type === "withdraw") {
                await fetch(`${API_URL}/api/withdraw`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(item.payload),
                });
            } else if (item.type === "wallet") {
                await fetch(`${API_URL}/api/wallet`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(item.payload),
                });
            } else {
                newOutbox.push(item);
            }
        } catch (err) {
            console.warn("flushOutboxOnce - falha ao enviar:", item, err);
            newOutbox.push(item);
        }
    }

    outbox = newOutbox;
    persistLocalState();
}

// loop de sincronização
function startOutboxFlushLoop() {
    flushOutboxOnce();
    setInterval(flushOutboxOnce, 10000);
    window.addEventListener("online", () => {
        console.log("Voltou online — sincronizando outbox...");
        flushOutboxOnce();
    });
}

// --- Enviar passos ao backend ---
async function sendStepsToBackend(delta = 0) {
    const payload = { steps, doge, wallet, delta, ts: Date.now() };
    if (!navigator.onLine) {
        queueOp({ type: "steps", payload });
        return false;
    }
    try {
        const res = await fetch(`${API_URL}/api/steps`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            queueOp({ type: "steps", payload });
            return false;
        }
        const json = await res.json();
        if (json.steps != null) steps = parseInt(json.steps);
        if (json.doge != null) doge = parseInt(json.doge);
        persistLocalState();
        render();
        return true;
    } catch (err) {
        console.warn("sendStepsToBackend - erro, enfileirando", err);
        queueOp({ type: "steps", payload });
        return false;
    }
}

// --- Pedir carteira ao backend ---
async function requestWalletFromBackend() {
    const payload = { ts: Date.now() };
    if (!navigator.onLine) {
        queueOp({ type: "wallet", payload });
        const local = generateLocalWallet();
        wallet = local;
        persistLocalState();
        render();
        return local;
    }
    try {
        const res = await fetch(`${API_URL}/api/wallet`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("wallet endpoint erro");
        const json = await res.json();
        if (json.address) {
            wallet = json.address;
            persistLocalState();
            render();
            return wallet;
        } else {
            const local = generateLocalWallet();
            wallet = local;
            persistLocalState();
            render();
            return local;
        }
    } catch (err) {
        console.warn("requestWalletFromBackend - erro, local:", err);
        const local = generateLocalWallet();
        wallet = local;
        persistLocalState();
        render();
        return local;
    }
}

// --- Levantamento ---
async function sendWithdrawRequest(addr, amt) {
    const payload = { address: addr, amount: amt, wallet, ts: Date.now() };
    if (!navigator.onLine) {
        queueOp({ type: "withdraw", payload });
        return { ok: false, queued: true, message: "Offline — pedido enfileirado." };
    }
    try {
        const res = await fetch(`${API_URL}/api/withdraw`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const txt = await res.text();
            return { ok: false, message: "Erro do servidor: " + txt };
        }
        const json = await res.json();
        if (json.doge != null) {
            doge = parseInt(json.doge);
            persistLocalState();
            render();
        }
        return { ok: true, message: json.message || "Pedido enviado." };
    } catch (err) {
        console.warn("withdraw - erro, enfileirando", err);
        queueOp({ type: "withdraw", payload });
        return { ok: false, queued: true, message: "Erro de rede — enfileirado." };
    }
}

// --- Utils ---
function generateLocalWallet() {
    return "DOGE-" + Math.random().toString(36).substring(2, 12).toUpperCase();
}

async function addStepLocalAndSync() {
    steps++;
    doge++;
    persistLocalState();
    render();
    await sendStepsToBackend(1);
}

async function onGenerateWalletClicked() {
    const el = document.getElementById("generateWalletBtn");
    if (el) el.disabled = true;
    await requestWalletFromBackend();
    if (el) el.disabled = false;
}

async function manualWithdraw() {
    const addr = document.getElementById("withdrawAddress")?.value || "";
    const amtStr = document.getElementById("withdrawAmount")?.value || "0";
    const amt = parseFloat(amtStr);
    const msgEl = document.getElementById("withdrawMsg");

    if (!addr || !amt || amt <= 0) {
        msgEl.textContent = "Preencha corretamente.";
        return;
    }
    if (amt > doge) {
        msgEl.textContent = "Saldo insuficiente.";
        return;
    }

    doge -= amt;
    persistLocalState();
    render();

    const res = await sendWithdrawRequest(addr, amt);
    msgEl.textContent = res.message;
}

function logout() {
    loggedIn = false;
    persistLocalState();
    document.getElementById("loginBox").style.display = "block";
    document.getElementById("appBox").style.display = "none";
}

// --- DOMContentLoaded ---
document.addEventListener("DOMContentLoaded", () => {
    render();

    const addBtn = document.getElementById("addStep");
    if (addBtn) addBtn.addEventListener("click", addStepLocalAndSync);

    const genWalletBtn = document.getElementById("generateWalletBtn");
    if (genWalletBtn) genWalletBtn.addEventListener("click", onGenerateWalletClicked);

    const withdrawBtn = document.getElementById("withdrawBtn");
    if (withdrawBtn) withdrawBtn.addEventListener("click", manualWithdraw);

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);

    startOutboxFlushLoop();

    (async () => {
        if (!navigator.onLine) return;
        try {
            const res = await fetch(`${API_URL}/api/status`, { method: "GET" });
            if (res.ok) {
                const json = await res.json();
                if (json.steps != null) steps = parseInt(json.steps);
                if (json.doge != null) doge = parseInt(json.doge);
                if (json.wallet) wallet = json.wallet;
                persistLocalState();
                render();
            }
        } catch (err) {}
    })();
});
