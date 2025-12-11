// login.js — controla apenas o login

const API_URL = "https://backend-doge-1.onrender.com";
const LOCAL_PIN = "1234";

// Função que valida o PIN no backend, com fallback local
async function validatePin(pin) {
    try {
        const res = await fetch(`${API_URL}/api/auth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pin }),
        });

        if (!res.ok) return false;

        const json = await res.json();
        return !!json.success;
    } catch (err) {
        console.warn("Erro no backend, usando fallback local.");
        return pin === LOCAL_PIN;
    }
}

// Função principal de login
async function login() {
    const pin = document.getElementById("pinInput")?.value || "";
    const loginErrorEl = document.getElementById("loginError");

    if (loginErrorEl) loginErrorEl.textContent = "";

    const valid = await validatePin(pin);

    if (valid) {
        // Mostrar telas principais
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("appBox").style.display = "block";
        document.getElementById("walletBox").style.display = "block";
        document.getElementById("withdrawBox").style.display = "block";

        // Guardar login local
        localStorage.setItem("loggedIn", "true");

        // Atualizar UI e sincronizar caso script.js já tenha carregado
        if (window.render) render();
        if (window.flushOutboxOnce) flushOutboxOnce();
    } else {
        loginErrorEl.textContent = "PIN incorreto!";
    }
}

// Inicialização do login
document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");

    if (loginBtn) loginBtn.addEventListener("click", login);

    // Se já estiver logado, pular login
    const logged = localStorage.getItem("loggedIn") === "true";

    if (logged) {
        document.getElementById("loginBox").style.display = "none";
    }
});
