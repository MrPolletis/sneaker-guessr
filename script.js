
/* ============================================================
   SNEAKERGUESSR — script.js
   Integración completa con Supabase Auth + Base de datos
   ============================================================ */

// ─── 1. CONFIGURACIÓN SUPABASE ────────────────────────────────
const SUPABASE_URL = "https://gaedfzothousntkdszwi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_idxoK1zSmo_oFVMg_oG6LA_VIkJiB4b";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── 2. ELEMENTOS DEL DOM ─────────────────────────────────────
const playBtn               = document.getElementById("play-btn");
const gameModeSetupBtn      = document.getElementById("game-mode-setup-btn");
const statsBtn              = document.getElementById("stats-btn");
const infoBtn               = document.getElementById("info-btn");
const infoModal             = document.getElementById("info-modal");
const closeInfoBtn          = document.getElementById("close-info-btn");
const statsModal            = document.getElementById("stats-modal");
const closeStatsBtn         = document.getElementById("close-stats-btn");
const gameModeModal         = document.getElementById("game-mode-modal");
const closeGameModeBtn      = document.getElementById("close-game-mode-btn");
const leaderboardBtn        = document.getElementById("leaderboard-btn");
const leaderboardModal      = document.getElementById("leaderboard-modal");
const closeLeaderboardBtn   = document.getElementById("close-leaderboard-btn");
const leaderboardBody       = document.getElementById("leaderboard-body");
const leaderboardLoading    = document.getElementById("leaderboard-loading");
const authBtn               = document.getElementById("auth-btn");
const filterModeContainer   = document.getElementById("filter-mode-container");
const filterDiffContainer   = document.getElementById("filter-diff-container");
const authModal             = document.getElementById("auth-modal");
const closeAuthBtn          = document.getElementById("close-auth-btn");
const tabLoginBtn           = document.getElementById("tab-login-btn");
const tabRegisterBtn        = document.getElementById("tab-register-btn");
const loginForm             = document.getElementById("login-form");
const registerForm          = document.getElementById("register-form");
const optModeClassic        = document.getElementById("opt-mode-classic");
const optModeExpert         = document.getElementById("opt-mode-expert");
const optDiffNormal         = document.getElementById("opt-diff-normal");
const optDiffHard           = document.getElementById("opt-diff-hard");
const optDiffExpert         = document.getElementById("opt-diff-expert");
const menuScreen            = document.getElementById("menu-screen");
const gameScreen            = document.getElementById("game-screen");
const sneakerImg            = document.getElementById("sneaker-img");
const optionsContainer      = document.getElementById("options-container");
const expertContainer       = document.getElementById("expert-mode-container");
const sneakerInput          = document.getElementById("sneaker-input");
const submitBtn             = document.getElementById("submit-guess");
const scoreVal              = document.getElementById("score-val");
const backToMenuBtn         = document.getElementById("back-to-menu-btn");
const feedbackToast         = document.getElementById("feedback-toast");
const feedbackDetails       = document.getElementById("feedback-details");
const scopeGlobalBtn        = document.getElementById("scope-global-btn");
const scopeCountryBtn       = document.getElementById("scope-country-btn");

// ─── 3. ESTADO GLOBAL ─────────────────────────────────────────
let sneakers            = [];
let gamePool            = [];
let currentSneaker      = {};
let score               = 0;
let gameMode            = 'classic';
let currentStreak       = 0;
const difficulties      = ['normal', 'hard', 'expert'];
let difficultyIndex     = 0;
let feedbackTimeout     = null;
let isProcessingAnswer  = false;
let selectedFilterMode  = "classic";
let selectedFilterDiff  = "normal";
let leaderboardScope    = "global"; // "global" | "country"

// Estado de usuario (Supabase)
let currentUser         = null;  // objeto de Supabase Auth
let currentProfile      = null;  // { id, username, country }
let currentStats        = {};    // { "classic_normal": { best_streak, total_points }, ... }

// ─── 4. INICIALIZACIÓN ────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
    applyLanguage(currentLang);
    updateModalUI();

    // Recuperar sesión activa si el usuario ya había iniciado sesión antes
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        await loadProfile();
    }
    updateAuthButton();
});

// ─── 5. FUNCIONES DE PERFIL Y ESTADÍSTICAS ───────────────────

async function loadProfile() {
    if (!currentUser) return;
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, username, country")
        .eq("id", currentUser.id)
        .single();

    if (error) {
        console.error("Error cargando perfil:", error.message);
        return;
    }
    currentProfile = data;
    await loadStats();
}

async function loadStats() {
    if (!currentProfile) return;
    const { data, error } = await supabaseClient
        .from("player_stats")
        .select("game_mode, difficulty, best_streak, total_points")
        .eq("user_id", currentProfile.id);

    if (error) {
        console.error("Error cargando estadísticas:", error.message);
        return;
    }

    currentStats = {};
    (data || []).forEach(row => {
        const key = `${row.game_mode}_${row.difficulty}`;
        currentStats[key] = {
            best_streak: row.best_streak,
            total_points: row.total_points
        };
    });
}

async function saveStatToSupabase(gameMode, difficulty, newStreak, addedPoints) {
    if (!currentProfile) return;

    const key = `${gameMode}_${difficulty}`;
    const existing = currentStats[key] || { best_streak: 0, total_points: 0 };
    const newBestStreak = Math.max(existing.best_streak, newStreak);
    const newTotalPoints = existing.total_points + addedPoints;

    const { error } = await supabaseClient
        .from("player_stats")
        .upsert({
            user_id: currentProfile.id,
            game_mode: gameMode,
            difficulty: difficulty,
            best_streak: newBestStreak,
            total_points: newTotalPoints,
            updated_at: new Date().toISOString()
        }, { onConflict: "user_id,game_mode,difficulty" });

    if (error) {
        console.error("Error guardando estadística:", error.message);
        return;
    }

    // Actualizar estado local
    currentStats[key] = { best_streak: newBestStreak, total_points: newTotalPoints };
}

// ─── 6. AUTENTICACIÓN ─────────────────────────────────────────

authBtn.addEventListener("click", () => {
    if (currentUser) {
        const msg = currentLang === 'es' ? "¿Quieres cerrar sesión?" : "Do you want to log out?";
        if (confirm(msg)) {
            supabaseClient.auth.signOut().then(() => {
                currentUser = null;
                currentProfile = null;
                currentStats = {};
                updateAuthButton();
            });
        }
    } else {
        authModal.classList.remove("hidden");
    }
});

closeAuthBtn.addEventListener("click", () => authModal.classList.add("hidden"));

// Pestañas Login / Registro
tabLoginBtn.addEventListener("click", () => {
    tabLoginBtn.classList.add("active");
    tabRegisterBtn.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
});

tabRegisterBtn.addEventListener("click", () => {
    tabRegisterBtn.classList.add("active");
    tabLoginBtn.classList.remove("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
});

// LOGIN
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email    = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const errorEl  = document.getElementById("login-error");
    const submitEl = document.getElementById("btn-submit-login");

    errorEl.classList.add("hidden");
    submitEl.disabled = true;
    submitEl.innerText = currentLang === 'es' ? "Entrando..." : "Logging in...";

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    submitEl.disabled = false;
    submitEl.innerText = currentLang === 'es' ? "ENTRAR" : "LOG IN";

    if (error) {
        errorEl.innerText = currentLang === 'es'
            ? "Email o contraseña incorrectos."
            : "Incorrect email or password.";
        errorEl.classList.remove("hidden");
        return;
    }

    currentUser = data.user;
    await loadProfile();
    loginForm.reset();
    authModal.classList.add("hidden");
    updateAuthButton();
});

// REGISTRO
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email    = document.getElementById("reg-email").value.trim();
    const username = document.getElementById("reg-username").value.trim().replace(/^@/, "").toLowerCase();
    const country  = document.getElementById("reg-country").value.trim().toUpperCase();
    const password = document.getElementById("reg-password").value;
    const errorEl  = document.getElementById("register-error");
    const submitEl = document.getElementById("btn-submit-reg");

    errorEl.classList.add("hidden");

    // Validaciones básicas
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        errorEl.innerText = currentLang === 'es'
            ? "El usuario debe tener entre 3 y 20 caracteres (letras, números y _)."
            : "Username must be 3-20 characters (letters, numbers and _).";
        errorEl.classList.remove("hidden");
        return;
    }

    if (!/^[A-Z]{2}$/.test(country)) {
        errorEl.innerText = currentLang === 'es'
            ? "El código de país debe ser de 2 letras (ej: ES, US, MX)."
            : "Country code must be 2 letters (e.g. ES, US, MX).";
        errorEl.classList.remove("hidden");
        return;
    }

    submitEl.disabled = true;
    submitEl.innerText = currentLang === 'es' ? "Creando cuenta..." : "Creating account...";

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: { username, country }
        }
    });

    submitEl.disabled = false;
    submitEl.innerText = currentLang === 'es' ? "CREAR CUENTA" : "SIGN UP";

    if (error) {
        errorEl.innerText = error.message;
        errorEl.classList.remove("hidden");
        return;
    }

    currentUser = data.user;
    // Esperar un momento para que el trigger de Supabase cree el perfil
    await new Promise(r => setTimeout(r, 1000));
    await loadProfile();
    registerForm.reset();
    authModal.classList.add("hidden");
    updateAuthButton();

    const welcomeMsg = currentLang === 'es'
        ? `¡Cuenta creada! Bienvenido, @${username} 🎉`
        : `Account created! Welcome, @${username} 🎉`;
    alert(welcomeMsg);
});

function updateAuthButton() {
    if (currentProfile) {
        authBtn.textContent = `👤 @${currentProfile.username} (${dictionary[currentLang].logoutText})`;
        authBtn.style.background = "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)";
    } else {
        authBtn.textContent = dictionary[currentLang].authBtn;
        authBtn.style.background = "linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)";
    }
}

// ─── 7. CLASIFICACIONES ───────────────────────────────────────

// Pestañas Global / Mi País
if (scopeGlobalBtn) {
    scopeGlobalBtn.addEventListener("click", () => {
        leaderboardScope = "global";
        scopeGlobalBtn.classList.add("active");
        scopeCountryBtn.classList.remove("active");
        renderLeaderboard();
    });
}

if (scopeCountryBtn) {
    scopeCountryBtn.addEventListener("click", () => {
        if (!currentProfile) {
            alert(currentLang === 'es'
                ? "Inicia sesión para ver el ranking de tu país."
                : "Log in to see your country ranking.");
            return;
        }
        leaderboardScope = "country";
        scopeCountryBtn.classList.add("active");
        scopeGlobalBtn.classList.remove("active");
        renderLeaderboard();
    });
}

leaderboardBtn.addEventListener("click", () => {
    renderLeaderboard();
    leaderboardModal.classList.remove("hidden");
});
closeLeaderboardBtn.addEventListener("click", () => leaderboardModal.classList.add("hidden"));

if (filterModeContainer) {
    filterModeContainer.querySelectorAll(".btn-filter-opt").forEach(btn => {
        btn.addEventListener("click", (e) => {
            filterModeContainer.querySelectorAll(".btn-filter-opt").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            selectedFilterMode = e.target.getAttribute("data-filter-mode");
            renderLeaderboard();
        });
    });
}

if (filterDiffContainer) {
    filterDiffContainer.querySelectorAll(".btn-filter-opt").forEach(btn => {
        btn.addEventListener("click", (e) => {
            filterDiffContainer.querySelectorAll(".btn-filter-opt").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            selectedFilterDiff = e.target.getAttribute("data-filter-diff");
            renderLeaderboard();
        });
    });
}

async function renderLeaderboard() {
    leaderboardBody.innerHTML = "";
    if (leaderboardLoading) leaderboardLoading.classList.remove("hidden");

    try {
        let query = supabaseClient
            .from("player_stats")
            .select(`
                best_streak,
                total_points,
                profiles!inner (
                    username,
                    country
                )
            `)
            .eq("game_mode", selectedFilterMode)
            .eq("difficulty", selectedFilterDiff)
            .order("best_streak", { ascending: false })
            .limit(10);

        // Filtrar por país si el scope es "country"
        if (leaderboardScope === "country" && currentProfile) {
            query = query.eq("profiles.country", currentProfile.country);
        }

        const { data, error } = await query;

        if (leaderboardLoading) leaderboardLoading.classList.add("hidden");

        if (error) {
            console.error("Error cargando clasificación:", error.message);
            leaderboardBody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#666;">Error al cargar datos.</td></tr>`;
            return;
        }

        const rows = data || [];

        for (let i = 0; i < 10; i++) {
            const row = document.createElement("tr");
            const entry = rows[i];

            if (entry && entry.best_streak > 0) {
                const isMe = currentProfile && entry.profiles.username === currentProfile.username;
                if (isMe) {
                    row.style.background = "rgba(255, 106, 0, 0.1)";
                    row.style.borderLeft = "3px solid #ff6a00";
                }

                const posCell = document.createElement("td");
                posCell.innerHTML = `<strong>${i + 1}º</strong>`;

                const nameCell = document.createElement("td");
                const nameText = isMe
                    ? `⭐ @${entry.profiles.username} (${currentLang === 'es' ? 'Tú' : 'You'})`
                    : `@${entry.profiles.username}`;
                nameCell.textContent = nameText;

                const countryCell = document.createElement("td");
                countryCell.textContent = entry.profiles.country;

                const streakCell = document.createElement("td");
                streakCell.innerHTML = `<strong>${entry.best_streak} 🔥</strong>`;

                row.appendChild(posCell);
                row.appendChild(nameCell);
                row.appendChild(countryCell);
                row.appendChild(streakCell);
            } else {
                row.innerHTML = `
                    <td><span style="color:#444;">${i + 1}º</span></td>
                    <td><span style="color:#444;">-</span></td>
                    <td><span style="color:#444;">-</span></td>
                    <td><span style="color:#444;">-</span></td>
                `;
            }

            leaderboardBody.appendChild(row);
        }
    } catch (err) {
        if (leaderboardLoading) leaderboardLoading.classList.add("hidden");
        console.error("Error inesperado en clasificación:", err);
    }
}

// ─── 8. ESTADÍSTICAS ──────────────────────────────────────────

statsBtn.addEventListener("click", openStatsModal);
closeStatsBtn.addEventListener("click", () => statsModal.classList.add("hidden"));

async function openStatsModal() {
    statsModal.classList.remove("hidden");

    const notLogged = document.getElementById("stats-not-logged");
    const gridContent = document.getElementById("stats-grid-content");

    if (!currentProfile) {
        if (notLogged) notLogged.classList.remove("hidden");
        if (gridContent) gridContent.classList.add("hidden");
        return;
    }

    if (notLogged) notLogged.classList.add("hidden");
    if (gridContent) gridContent.classList.remove("hidden");

    // Recargar stats desde Supabase
    await loadStats();

    const getTotalPoints = () => {
        return Object.values(currentStats).reduce((sum, s) => sum + (s.total_points || 0), 0);
    };

    const getStreak = (key) => (currentStats[key] && currentStats[key].best_streak) || 0;

    document.getElementById("total-points-val").textContent = getTotalPoints();
    document.getElementById("streak-classic-normal-val").textContent = getStreak("classic_normal");
    document.getElementById("streak-classic-hard-val").textContent = getStreak("classic_hard");
    document.getElementById("streak-classic-expert-val").textContent = getStreak("classic_expert");
    document.getElementById("streak-expert-normal-val").textContent = getStreak("expert_normal");
    document.getElementById("streak-expert-hard-val").textContent = getStreak("expert_hard");
    document.getElementById("streak-expert-expert-val").textContent = getStreak("expert_expert");
}

// ─── 9. MOTOR DE JUEGO ────────────────────────────────────────

playBtn.addEventListener("click", () => {
    menuScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    startGame();
});

backToMenuBtn.addEventListener("click", () => {
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
    isProcessingAnswer = false;
    feedbackToast.classList.add("hidden");
    feedbackDetails.classList.add("hidden");
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
});

async function startGame() {
    try {
        const response = await fetch('zapatillas.json');
        sneakers = await response.json();

        if (!sneakers || sneakers.length === 0) {
            alert(dictionary[currentLang].emptyJsonAlert);
            return;
        }

        score = 0;
        currentStreak = 0;
        scoreVal.innerText = score;
        feedbackToast.classList.add("hidden");
        feedbackDetails.classList.add("hidden");
        isProcessingAnswer = false;

        prepareGamePool();
        nextQuestion();
    } catch (error) {
        alert(dictionary[currentLang].criticalErrorAlert);
        console.error(error);
    }
}

function prepareGamePool() {
    const diff = difficulties[difficultyIndex];
    if (diff === 'normal') {
        const seenNames = new Set();
        gamePool = sneakers.filter(sneaker => {
            const modelName = sneaker.nombre.trim().toLowerCase();
            if (seenNames.has(modelName)) return false;
            seenNames.add(modelName);
            return true;
        });
    } else {
        gamePool = [...sneakers];
    }
}

function formatSneakerText(sneaker, diff) {
    const nombreBase   = sneaker.nombre.trim();
    const colorwayBase = (sneaker.colorway || "").trim();
    const elAnioReal   = (sneaker.año || sneaker.anio || sneaker.lanzamiento || "").toString().trim();

    if (diff === 'normal') return nombreBase;
    if (diff === 'hard')   return `${nombreBase} ${colorwayBase}`.trim();
    if (diff === 'expert') return `${nombreBase} ${colorwayBase} ${elAnioReal}`.trim();
    return nombreBase;
}

function nextQuestion() {
    if (gamePool.length === 0) prepareGamePool();

    const randomIndex = Math.floor(Math.random() * gamePool.length);
    currentSneaker = gamePool[randomIndex];
    gamePool.splice(randomIndex, 1);
    sneakerImg.src = currentSneaker.imagen;

    if (gameMode === 'classic') {
        optionsContainer.classList.remove("hidden");
        expertContainer.classList.add("hidden");
        generateButtons();
    } else {
        optionsContainer.classList.add("hidden");
        expertContainer.classList.remove("hidden");
        sneakerInput.value = "";
        sneakerInput.focus();
        updateExpertInstructions();
    }
}

function updateExpertInstructions() {
    const instructionEl = document.getElementById("expert-instruction");
    if (!instructionEl) return;
    const diff = difficulties[difficultyIndex];

    if (currentLang === 'es') {
        if (diff === 'normal')      instructionEl.innerText = "Modo: NORMAL\n📝 Escribe solo el nombre del modelo\nEjemplo: Nike Air Max 95";
        else if (diff === 'hard')   instructionEl.innerText = "Modo: DIFÍCIL\n🎨 Estructura: Nombre + Colorway\nEjemplo: Nike Air Max 95 Neon";
        else if (diff === 'expert') instructionEl.innerText = "Modo: EXPERTO 🔥\n📅 Estructura: Nombre + Colorway + Año\nEjemplo: Nike Air Max 95 Neon 1995";
        sneakerInput.placeholder = diff === 'normal' ? "Nombre del modelo..." : diff === 'hard' ? "Nombre + Colorway..." : "Nombre + Colorway + Año...";
    } else {
        if (diff === 'normal')      instructionEl.innerText = "Mode: NORMAL\n📝 Type only the model name\nExample: Nike Air Max 95";
        else if (diff === 'hard')   instructionEl.innerText = "Mode: HARD\n🎨 Structure: Name + Colorway\nExample: Nike Air Max 95 Neon";
        else if (diff === 'expert') instructionEl.innerText = "Mode: EXPERT 🔥\n📅 Structure: Name + Colorway + Year\nExample: Nike Air Max 95 Neon 1995";
        sneakerInput.placeholder = diff === 'normal' ? "Model name..." : diff === 'hard' ? "Name + Colorway..." : "Name + Colorway + Year...";
    }
}

function generateButtons() {
    optionsContainer.innerHTML = "";
    const diff = difficulties[difficultyIndex];
    const correctText = formatSneakerText(currentSneaker, diff);

    const sameBrandSneakers = sneakers.filter(s => s.marca.toLowerCase() === currentSneaker.marca.toLowerCase());
    let brandDistractors = [...new Set(sameBrandSneakers.map(s => formatSneakerText(s, diff)))].filter(t => t !== correctText);
    brandDistractors.sort(() => Math.random() - 0.5);

    let selectedDistractors = [];
    if (brandDistractors.length >= 3) {
        selectedDistractors = brandDistractors.slice(0, 3);
    } else {
        selectedDistractors = [...brandDistractors];
        const otherDistractors = [...new Set(
            sneakers.filter(s => s.marca.toLowerCase() !== currentSneaker.marca.toLowerCase())
                    .map(s => formatSneakerText(s, diff))
        )];
        otherDistractors.sort(() => Math.random() - 0.5);
        selectedDistractors = selectedDistractors.concat(otherDistractors.slice(0, 3 - selectedDistractors.length));
    }

    const selectedOptions = [correctText, ...selectedDistractors];
    selectedOptions.sort(() => Math.random() - 0.5);

    selectedOptions.forEach(text => {
        const btn = document.createElement("button");
        btn.classList.add("answer-btn");
        btn.textContent = text;
        btn.onclick = () => checkAnswer(text);
        optionsContainer.appendChild(btn);
    });
}

sneakerInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") checkAnswer(sneakerInput.value);
});

if (submitBtn) {
    submitBtn.addEventListener("click", () => checkAnswer(sneakerInput.value));
}

async function checkAnswer(guess) {
    if (isProcessingAnswer) return;
    isProcessingAnswer = true;

    const userAnswer  = guess.toLowerCase().trim();
    const diff        = difficulties[difficultyIndex];
    let isCorrect     = false;

    const correctAnswer = formatSneakerText(currentSneaker, diff).toLowerCase().trim();
    let validAnswers = [correctAnswer];

    const brand = currentSneaker.marca.toLowerCase().trim();
    if (correctAnswer.startsWith(brand)) {
        const withoutBrand = correctAnswer.substring(brand.length).trim();
        if (withoutBrand) validAnswers.push(withoutBrand);
    }

    if (currentSneaker.sinonimos && Array.isArray(currentSneaker.sinonimos)) {
        currentSneaker.sinonimos.forEach(sinonimo => {
            const sinClean = sinonimo.toLowerCase().trim();
            if (diff === 'normal') {
                validAnswers.push(sinClean);
            } else if (diff === 'hard') {
                validAnswers.push(`${sinClean} ${(currentSneaker.colorway || "").toLowerCase().trim()}`.trim());
            } else if (diff === 'expert') {
                const cw   = (currentSneaker.colorway || "").toLowerCase().trim();
                const year = (currentSneaker.año || currentSneaker.anio || currentSneaker.lanzamiento || "").toString().toLowerCase().trim();
                validAnswers.push(`${sinClean} ${cw} ${year}`.trim());
            }
        });
    }

    if (gameMode === 'classic') {
        isCorrect = (userAnswer === correctAnswer);
    } else {
        isCorrect = validAnswers.includes(userAnswer);
        if (!isCorrect) {
            const targetWords = /\b(high|low|mid)\b/gi;
            const cleanUser   = userAnswer.replace(targetWords, '').replace(/\s+/g, ' ').trim();
            const cleanValids = validAnswers.map(a => a.replace(targetWords, '').replace(/\s+/g, ' ').trim());
            isCorrect = cleanValids.includes(cleanUser);
        }
    }

    const respuestaRevelada = formatSneakerText(currentSneaker, diff);

    if (isCorrect) {
        score += 10;
        currentStreak++;
        scoreVal.innerText = score;

        // Guardar en Supabase si hay sesión
        if (currentProfile) {
            await saveStatToSupabase(gameMode, diff, currentStreak, 10);
        }

        feedbackToast.textContent = dictionary[currentLang].correctToast(currentStreak);
        feedbackToast.className = "feedback-banner correct";
        feedbackToast.classList.remove("hidden");
    } else {
        currentStreak = 0;
        scoreVal.innerText = score;

        feedbackToast.textContent = dictionary[currentLang].incorrectToast;
        feedbackToast.className = "feedback-banner incorrect";
        feedbackToast.classList.remove("hidden");

        feedbackDetails.innerHTML = `${dictionary[currentLang].exactAnswerWas}<br><strong>${respuestaRevelada}</strong>`;
        feedbackDetails.classList.remove("hidden");
    }

    feedbackTimeout = setTimeout(() => {
        feedbackToast.classList.add("hidden");
        feedbackDetails.classList.add("hidden");
        isProcessingAnswer = false;
        nextQuestion();
    }, 2000);
}

// ─── 10. AJUSTES DE PARTIDA ───────────────────────────────────

gameModeSetupBtn.addEventListener("click", () => {
    updateModalUI();
    gameModeModal.classList.remove("hidden");
});
closeGameModeBtn.addEventListener("click", () => gameModeModal.classList.add("hidden"));

optModeClassic.addEventListener("click", () => {
    if (gameMode !== 'classic') {
        gameMode = 'classic'; currentStreak = 0; updateModalUI();
        if (!gameScreen.classList.contains("hidden")) { prepareGamePool(); nextQuestion(); }
    }
});
optModeExpert.addEventListener("click", () => {
    if (gameMode !== 'expert') {
        gameMode = 'expert'; currentStreak = 0; updateModalUI();
        if (!gameScreen.classList.contains("hidden")) { prepareGamePool(); nextQuestion(); }
    }
});
optDiffNormal.addEventListener("click", () => {
    if (difficultyIndex !== 0) {
        difficultyIndex = 0; currentStreak = 0; updateModalUI();
        if (!gameScreen.classList.contains("hidden")) { prepareGamePool(); nextQuestion(); }
    }
});
optDiffHard.addEventListener("click", () => {
    if (difficultyIndex !== 1) {
        difficultyIndex = 1; currentStreak = 0; updateModalUI();
        if (!gameScreen.classList.contains("hidden")) { prepareGamePool(); nextQuestion(); }
    }
});
optDiffExpert.addEventListener("click", () => {
    if (difficultyIndex !== 2) {
        difficultyIndex = 2; currentStreak = 0; updateModalUI();
        if (!gameScreen.classList.contains("hidden")) { prepareGamePool(); nextQuestion(); }
    }
});

function updateModalUI() {
    [optModeClassic, optModeExpert, optDiffNormal, optDiffHard, optDiffExpert].forEach(b => b.classList.remove("active"));
    if (gameMode === 'classic') optModeClassic.classList.add("active");
    else optModeExpert.classList.add("active");
    if (difficultyIndex === 0) optDiffNormal.classList.add("active");
    else if (difficultyIndex === 1) optDiffHard.classList.add("active");
    else optDiffExpert.classList.add("active");
}

// ─── 11. CIERRE DE MODALES AL HACER CLIC FUERA ───────────────

window.addEventListener("click", (e) => {
    if (e.target === statsModal)      statsModal.classList.add("hidden");
    if (e.target === gameModeModal)   gameModeModal.classList.add("hidden");
    if (e.target === infoModal)       infoModal.classList.add("hidden");
    if (e.target === leaderboardModal) leaderboardModal.classList.add("hidden");
    if (e.target === authModal)       authModal.classList.add("hidden");
});

infoBtn.addEventListener("click", () => infoModal.classList.remove("hidden"));
closeInfoBtn.addEventListener("click", () => infoModal.classList.add("hidden"));

// ─── 12. IDIOMA ───────────────────────────────────────────────

const dictionary = {
    es: {
        scoreText: "PUNTOS",
        playBtn: "JUGAR",
        gameModeBtn: "MODO DE JUEGO",
        authBtn: "🔐 INICIAR SESIÓN",
        submitGuessBtn: "ADIVINAR",
        backToMenuBtn: "VOLVER AL MENÚ",
        helloText: "HOLA",
        logoutText: "SALIR",
        statsTitle: "📊 MIS RÉCORDS",
        totalPointsLabel: "PUNTOS TOTALES (DE SIEMPRE)",
        gameSettingsTitle: "⚙️ AJUSTES DE PARTIDA",
        gameModeHeading: "MODO DE JUEGO",
        difficultyHeading: "DIFICULTAD",
        infoTitle: "ℹ️ ¿CÓMO JUGAR?",
        correctToast: (streak) => `✅ ¡Correcto! (Racha: ${streak})`,
        incorrectToast: "❌ ¡Fallaste!",
        exactAnswerWas: "La respuesta exacta era:",
        emptyJsonAlert: "El archivo zapatillas.json parece estar vacío.",
        criticalErrorAlert: "Error crítico al cargar zapatillas.json. Abre index.html usando 'Live Server'.",
        shareMessage: (streak, points) => `¡Llevo una racha de ${streak} aciertos y ${points} puntos en SneakerGuessr! ¿Podrás superarme? 👟🔥 Juega gratis aquí: https://sneakerguessr.com`,
        copiedAlert: "📋 ¡Texto de compartir copiado al portapapeles!"
    },
    en: {
        scoreText: "SCORE",
        playBtn: "PLAY",
        gameModeBtn: "GAME MODE",
        authBtn: "🔐 LOG IN",
        submitGuessBtn: "GUESS",
        backToMenuBtn: "BACK TO MENU",
        helloText: "HELLO",
        logoutText: "LOGOUT",
        statsTitle: "📊 MY RECORDS",
        totalPointsLabel: "TOTAL POINTS (ALL TIME)",
        gameSettingsTitle: "⚙️ GAME SETTINGS",
        gameModeHeading: "GAME MODE",
        difficultyHeading: "DIFFICULTY",
        infoTitle: "ℹ️ HOW TO PLAY?",
        correctToast: (streak) => `✅ Correct! (Streak: ${streak})`,
        incorrectToast: "❌ Incorrect!",
        exactAnswerWas: "The exact answer was:",
        emptyJsonAlert: "The file zapatillas.json appears to be empty.",
        criticalErrorAlert: "Critical error loading zapatillas.json. Open index.html using 'Live Server'.",
        shareMessage: (streak, points) => `I'm on a streak of ${streak} correct answers and ${points} points on SneakerGuessr! Can you beat me? 👟🔥 Play for free here: https://sneakerguessr.com`,
        copiedAlert: "📋 Sharing text copied to clipboard!"
    }
};

let currentLang = localStorage.getItem("sneaker_lang") || "es";

function applyLanguage(lang) {
    const texts = dictionary[lang];
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };

    set("score-text", texts.scoreText);
    set("play-btn", texts.playBtn);
    set("game-mode-setup-btn", texts.gameModeBtn);
    set("submit-guess", texts.submitGuessBtn);
    set("back-to-menu-btn", texts.backToMenuBtn);
    set("tab-login-btn", lang === 'es' ? "INICIAR SESIÓN" : "LOG IN");
    set("tab-register-btn", lang === 'es' ? "REGISTRARSE" : "SIGN UP");

    updateAuthButton();

    const statsTitle = document.querySelector("#stats-modal h2");
    if (statsTitle) statsTitle.innerText = texts.statsTitle;

    const totalPointsLabel = document.querySelector("#stats-modal .stat-box.full-width .stat-label");
    if (totalPointsLabel) totalPointsLabel.innerText = texts.totalPointsLabel;

    const gameSettingsTitle = document.querySelector("#game-mode-modal h2");
    if (gameSettingsTitle) gameSettingsTitle.innerText = texts.gameSettingsTitle;

    const gameModeHeadings = document.querySelectorAll("#game-mode-modal h3");
    if (gameModeHeadings.length >= 2) {
        gameModeHeadings[0].innerText = texts.gameModeHeading;
        gameModeHeadings[1].innerText = texts.difficultyHeading;
    }

    const infoTitle = document.querySelector("#info-modal h2");
    if (infoTitle) infoTitle.innerText = texts.infoTitle;

    const langBtn = document.getElementById("lang-btn");
    if (langBtn) langBtn.innerText = lang === "es" ? "🇪🇸" : "🇬🇧";

    if (!gameScreen.classList.contains("hidden") && gameMode === 'expert') {
        updateExpertInstructions();
    }
}

document.getElementById("lang-btn").addEventListener("click", () => {
    currentLang = currentLang === "es" ? "en" : "es";
    localStorage.setItem("sneaker_lang", currentLang);
    applyLanguage(currentLang);
});

document.getElementById("share-btn").addEventListener("click", async () => {
    const textToShare = dictionary[currentLang].shareMessage(currentStreak || 0, score || 0);
    if (navigator.share) {
        try {
            await navigator.share({ title: 'SneakerGuessr', text: textToShare, url: 'https://sneakerguessr.com' });
        } catch (err) {
            console.log("Compartir cancelado", err);
        }
    } else {
        try {
            await navigator.clipboard.writeText(textToShare);
            alert(dictionary[currentLang].copiedAlert);
        } catch (err) {
            alert(textToShare);
        }
    }
});