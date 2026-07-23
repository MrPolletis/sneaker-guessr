// ====
// CONFIGURACIÓN SUPABASE
// IMPORTANTE: En Supabase > Authentication > Providers > Email,
// deja desactivada la confirmación por correo.
// ====
const SUPABASE_URL = "https://gaedfzothousntkdszwi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_idxoK1zSmo_oFVMg_oG6LA_VIkJiB4b";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// El email es solo un identificador interno de Supabase: el jugador nunca lo ve.
const AUTH_EMAIL_DOMAIN = "@sneakerguessr.com";

function normalizeUsername(value) {
    return value.trim().replace(/^@+/, "");
}

function usernameToAuthEmail(username) {
    return `${username.toLowerCase()}${AUTH_EMAIL_DOMAIN}`;
}

// ====
// REFERENCIAS A ELEMENTOS DEL HTML
// ====
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

// ====
// VARIABLES DE ESTADO
// ====
let sneakers        = [];
let gamePool        = [];
let currentSneaker  = {};
let score           = 0;
let gameMode        = 'classic';
let currentStreak   = 0;
const difficulties  = ['normal', 'hard', 'expert'];
let difficultyIndex = 0;

let feedbackTimeout     = null;
let isProcessingAnswer  = false;

// Estado de los filtros del leaderboard
let selectedFilterMode = "classic";
let selectedFilterDiff = "normal";

// Estado de autenticación Supabase
let currentUser  = null;
let profileData  = null;

// ====
// AUTENTICACIÓN — SUPABASE
// ====

/**
 * Inicializa el listener de sesión. Se llama en DOMContentLoaded.
 */
async function initAuth() {
    // Escuchar cualquier cambio de sesión en tiempo real
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
            currentUser = session.user;
            await loadProfileData();
        } else {
            currentUser = null;
            profileData = null;
        }
        updateAuthButton();
    });

    // Comprobar si hay sesión activa al cargar la página (recarga / nueva pestaña)
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && session.user) {
        currentUser = session.user;
        await loadProfileData();
        updateAuthButton();
    }
}

/**
 * Carga los datos del perfil (username, country) desde la tabla 'profiles'.
 */
async function loadProfileData() {
    if (!currentUser) return;
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

    if (!error && data) {
        profileData = data;
    }
}

/**
 * Actualiza el botón de autenticación del menú según el estado de sesión.
 */
function updateAuthButton() {
    if (currentUser && profileData) {
        authBtn.innerText = `👤 @${profileData.username} (${currentLang === 'es' ? 'Salir' : 'Logout'})`;
        authBtn.style.background = "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)";
    } else {
        authBtn.innerText = dictionary[currentLang] ? dictionary[currentLang].authBtn : "🔐 INICIAR SESIÓN";
        authBtn.style.background = "linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)";
    }
}

/**
 * Guarda una racha récord en Supabase.
 * Solo se llama cuando el jugador supera su mejor marca local.
 */
async function saveStatToSupabase(gm, diff, newStreak) {
    if (!currentUser) return;
    try {
        // Obtener el valor actual en Supabase (por si el jugador tiene otro dispositivo)
        const { data: existing } = await supabaseClient
            .from('player_stats')
            .select('best_streak')
            .eq('user_id', currentUser.id)
            .eq('game_mode', gm)
            .eq('difficulty', diff)
            .maybeSingle();

        const dbBest   = existing ? (existing.best_streak || 0) : 0;
        const finalBest = Math.max(newStreak, dbBest);

        await supabaseClient
            .from('player_stats')
            .upsert(
                {
                    user_id:      currentUser.id,
                    game_mode:    gm,
                    difficulty:   diff,
                    best_streak:  finalBest,
                    updated_at:   new Date().toISOString()
                },
                { onConflict: 'user_id,game_mode,difficulty' }
            );
    } catch (err) {
        console.error("Error guardando estadística en Supabase:", err);
    }
}

// ====
// EVENTOS — MENÚ PRINCIPAL
// ====

playBtn.addEventListener("click", () => {
    menuScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    startGame();
});

gameModeSetupBtn.addEventListener("click", () => {
    updateModalUI();
    gameModeModal.classList.remove("hidden");
});

closeGameModeBtn.addEventListener("click", () => {
    gameModeModal.classList.add("hidden");
});

statsBtn.addEventListener("click", openStatsModal);
closeStatsBtn.addEventListener("click", () => statsModal.classList.add("hidden"));

infoBtn.addEventListener("click", () => infoModal.classList.remove("hidden"));
closeInfoBtn.addEventListener("click", () => infoModal.classList.add("hidden"));

// Leaderboard
leaderboardBtn.addEventListener("click", () => {
    renderLeaderboard();
    leaderboardModal.classList.remove("hidden");
});
closeLeaderboardBtn.addEventListener("click", () => leaderboardModal.classList.add("hidden"));

// Filtros de modo (Classic / Expert)
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

// Filtros de dificultad (Normal / Hard / Expert)
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

// Botón de autenticación del menú
authBtn.addEventListener("click", () => {
    if (currentUser) {
        const msg = currentLang === 'es' ? "¿Quieres cerrar sesión?" : "Do you want to log out?";
        if (confirm(msg)) {
            supabaseClient.auth.signOut();
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

// ====
// REGISTRO — SUPABASE
// ====
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const errorEl = document.getElementById("register-error");
    errorEl.classList.add("hidden");
    errorEl.textContent = "";

    // El @ es solo visual: @Juanitopro67 y Juanitopro67 son la misma cuenta.
    const usernameVal = normalizeUsername(document.getElementById("reg-username").value);
    const usernameKey = usernameVal.toLowerCase();
    const countryVal  = document.getElementById("reg-country").value.trim().toUpperCase();
    const passVal     = document.getElementById("reg-password").value;

    // Validaciones locales
    if (usernameVal.length < 3 || usernameVal.length > 20) {
        errorEl.textContent = currentLang === 'es'
            ? "El usuario debe tener entre 3 y 20 caracteres."
            : "Username must have between 3 and 20 characters.";
        errorEl.classList.remove("hidden");
        return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(usernameVal)) {
        errorEl.textContent = currentLang === 'es'
            ? "El usuario solo puede usar letras, números y guion bajo (_)."
            : "Username can only use letters, numbers and underscores (_).";
        errorEl.classList.remove("hidden");
        return;
    }
    if (countryVal.length !== 2) {
        errorEl.textContent = currentLang === 'es'
            ? "Escribe el código de país de 2 letras (ej: ES, US, MX)."
            : "Enter a 2-letter country code (e.g. ES, US, MX).";
        errorEl.classList.remove("hidden");
        return;
    }
    if (passVal.length < 6) {
        errorEl.textContent = currentLang === 'es'
            ? "La contraseña debe tener mínimo 6 caracteres."
            : "Password must be at least 6 characters.";
        errorEl.classList.remove("hidden");
        return;
    }

    const submitRegBtn = document.getElementById("btn-submit-reg");
    submitRegBtn.disabled = true;
    submitRegBtn.textContent = currentLang === 'es' ? "Creando cuenta..." : "Creating account...";

    const authEmail = usernameToAuthEmail(usernameVal);

    // Supabase usa este identificador interno y guarda la contraseña de forma segura.
    const { data, error } = await supabaseClient.auth.signUp({
        email: authEmail,
        password: passVal,
        options: {
            data: { username: usernameVal, username_key: usernameKey, country: countryVal }
        }
    });

    if (error) {
        // Mensaje de error personalizado
        let msg = error.message;
        if (msg.includes("already registered") || msg.includes("User already registered")) {
            msg = currentLang === 'es'
                ? "Ese nombre de usuario ya está en uso."
                : "That username is already taken.";
        }
        errorEl.textContent = msg;
        errorEl.classList.remove("hidden");
        submitRegBtn.disabled = false;
        submitRegBtn.textContent = currentLang === 'es' ? "CREAR CUENTA" : "CREATE ACCOUNT";
        return;
    }

    // Crear fila en la tabla 'profiles'
    if (data && data.user) {
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .insert({
                id:       data.user.id,
                username: usernameVal,
                country:  countryVal
            });

        if (profileError) {
            console.warn("Perfil ya existe o error al crearlo:", profileError.message);
        }
    }

    registerForm.reset();
    authModal.classList.add("hidden");
    submitRegBtn.disabled = false;
    submitRegBtn.textContent = currentLang === 'es' ? "CREAR CUENTA" : "CREATE ACCOUNT";

    alert(currentLang === 'es'
        ? `¡Cuenta creada! Bienvenido, @${usernameVal} 🎉`
        : `Account created! Welcome, @${usernameVal} 🎉`);
});

// ====
// LOGIN — SUPABASE
// ====
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const errorEl = document.getElementById("login-error");
    errorEl.classList.add("hidden");
    errorEl.textContent = "";

    const usernameVal = document.getElementById("login-username").value.trim().toLowerCase();
    const passVal     = document.getElementById("login-password").value;

    const submitLoginBtn = document.getElementById("btn-submit-login");
    submitLoginBtn.disabled = true;
    submitLoginBtn.textContent = currentLang === 'es' ? "Entrando..." : "Logging in...";

    const fakeEmail = usernameVal + FAKE_EMAIL_DOMAIN;

    const { error } = await supabaseClient.auth.signInWithPassword({
        email:    fakeEmail,
        password: passVal
    });

    if (error) {
        errorEl.textContent = currentLang === 'es'
            ? "Usuario o contraseña incorrectos."
            : "Incorrect username or password.";
        errorEl.classList.remove("hidden");
        submitLoginBtn.disabled = false;
        submitLoginBtn.textContent = currentLang === 'es' ? "ENTRAR" : "LOG IN";
        return;
    }

    // Si todo fue bien, onAuthStateChange actualizará el estado automáticamente
    loginForm.reset();
    authModal.classList.add("hidden");
    submitLoginBtn.disabled = false;
    submitLoginBtn.textContent = currentLang === 'es' ? "ENTRAR" : "LOG IN";
});

// ====
// CIERRE DE MODALES AL CLICAR FUERA
// ====
window.addEventListener("click", (e) => {
    if (e.target === statsModal)      statsModal.classList.add("hidden");
    if (e.target === gameModeModal)   gameModeModal.classList.add("hidden");
    if (e.target === infoModal)       infoModal.classList.add("hidden");
    if (e.target === leaderboardModal) leaderboardModal.classList.add("hidden");
    if (e.target === authModal)       authModal.classList.add("hidden");
});

backToMenuBtn.addEventListener("click", () => {
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
    isProcessingAnswer = false;
    feedbackToast.classList.add("hidden");
    feedbackDetails.classList.add("hidden");
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
});

// ====
// AJUSTES DE PARTIDA
// ====
optModeClassic.addEventListener("click", () => {
    if (gameMode !== 'classic') {
        gameMode = 'classic';
        currentStreak = 0;
        updateModalUI();
        if (!gameScreen.classList.contains("hidden")) { prepareGamePool(); nextQuestion(); }
    }
});

optModeExpert.addEventListener("click", () => {
    if (gameMode !== 'expert') {
        gameMode = 'expert';
        currentStreak = 0;
        updateModalUI();
        if (!gameScreen.classList.contains("hidden")) { prepareGamePool(); nextQuestion(); }
    }
});

optDiffNormal.addEventListener("click", () => {
    if (difficultyIndex !== 0) {
        difficultyIndex = 0;
        currentStreak = 0;
        updateModalUI();
        if (!gameScreen.classList.contains("hidden")) { prepareGamePool(); nextQuestion(); }
    }
});

optDiffHard.addEventListener("click", () => {
    if (difficultyIndex !== 1) {
        difficultyIndex = 1;
        currentStreak = 0;
        updateModalUI();
        if (!gameScreen.classList.contains("hidden")) { prepareGamePool(); nextQuestion(); }
    }
});

optDiffExpert.addEventListener("click", () => {
    if (difficultyIndex !== 2) {
        difficultyIndex = 2;
        currentStreak = 0;
        updateModalUI();
        if (!gameScreen.classList.contains("hidden")) { prepareGamePool(); nextQuestion(); }
    }
});

function updateModalUI() {
    [optModeClassic, optModeExpert, optDiffNormal, optDiffHard, optDiffExpert]
        .forEach(b => b.classList.remove("active"));

    if (gameMode === 'classic') optModeClassic.classList.add("active");
    else                    optModeExpert.classList.add("active");

    if      (difficultyIndex === 0) optDiffNormal.classList.add("active");
    else if (difficultyIndex === 1) optDiffHard.classList.add("active");
    else if (difficultyIndex === 2) optDiffExpert.classList.add("active");
}

// ====
// LEADERBOARD — SUPABASE (GLOBAL)
// ====
async function renderLeaderboard() {
    leaderboardBody.innerHTML = `
        <tr>
            <td colspan="4" style="text-align:center; padding:20px; color:#888;">
                ⏳ ${currentLang === 'es' ? 'Cargando ranking...' : 'Loading ranking...'}
            </td>
        </tr>`;

    try {
        const { data, error } = await supabaseClient
            .from('player_stats')
            .select('best_streak, user_id, profiles(username, country)')
            .eq('game_mode', selectedFilterMode)
            .eq('difficulty', selectedFilterDiff)
            .order('best_streak', { ascending: false })
            .limit(10);

        leaderboardBody.innerHTML = "";

        for (let i = 0; i < 10; i++) {
            const row   = document.createElement("tr");
            const entry = data && data[i];

            if (entry && entry.best_streak > 0) {
                const isMe     = currentUser && entry.user_id === currentUser.id;
                const username = (entry.profiles && entry.profiles.username) ? entry.profiles.username : "???";
                const country  = (entry.profiles && entry.profiles.country)  ? entry.profiles.country  : "??";

                if (isMe) {
                    row.style.background   = "rgba(255, 106, 0, 0.1)";
                    row.style.borderLeft   = "3px solid #ff6a00";
                }

                const posCell = document.createElement("td");
                posCell.innerHTML = `<strong>${i + 1}º</strong>`;

                const nameCell = document.createElement("td");
                nameCell.textContent = isMe
                    ? `⭐ @${username} (${currentLang === 'es' ? 'Tú' : 'You'})`
                    : `@${username}`;

                const countryCell = document.createElement("td");
                countryCell.textContent = country;

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
                    <td><span style="color:#444;">-</span></td>`;
            }

            leaderboardBody.appendChild(row);
        }

    } catch (err) {
        console.error("Error al cargar el leaderboard:", err);
        leaderboardBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center; padding:20px; color:#e74c3c;">
                    ❌ Error al cargar el ranking
                </td>
            </tr>`;
    }
}

// ====
// MOTOR DE JUEGO
// ====
async function startGame() {
    try {
        const response = await fetch('zapatillas.json');
        sneakers = await response.json();

        if (!sneakers || sneakers.length === 0) {
            alert(dictionary[currentLang].emptyJsonAlert);
            return;
        }

        score         = 0;
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

    const randomIndex  = Math.floor(Math.random() * gamePool.length);
    currentSneaker     = gamePool[randomIndex];
    gamePool.splice(randomIndex, 1);
    sneakerImg.src     = currentSneaker.imagen;

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
        if (diff === 'normal') {
            instructionEl.innerText    = "Modo: NORMAL\n📝 Escribe solo el nombre del modelo\nEjemplo: Nike Air Max 95";
            sneakerInput.placeholder   = "Nombre del modelo...";
        } else if (diff === 'hard') {
            instructionEl.innerText    = "Modo: DIFÍCIL\n🎨 Estructura: Nombre + Colorway\nEjemplo: Nike Air Max 95 Neon";
            sneakerInput.placeholder   = "Nombre + Colorway...";
        } else if (diff === 'expert') {
            instructionEl.innerText    = "Modo: EXPERTO 🔥\n📅 Estructura: Nombre + Colorway + Año\nEjemplo: Nike Air Max 95 Neon 1995";
            sneakerInput.placeholder   = "Nombre + Colorway + Año...";
        }
    } else {
        if (diff === 'normal') {
            instructionEl.innerText    = "Mode: NORMAL\n📝 Type only the model name\nExample: Nike Air Max 95";
            sneakerInput.placeholder   = "Model name...";
        } else if (diff === 'hard') {
            instructionEl.innerText    = "Mode: HARD\n🎨 Structure: Name + Colorway\nExample: Nike Air Max 95 Neon";
            sneakerInput.placeholder   = "Name + Colorway...";
        } else if (diff === 'expert') {
            instructionEl.innerText    = "Mode: EXPERT 🔥\n📅 Structure: Name + Colorway + Year\nExample: Nike Air Max 95 Neon 1995";
            sneakerInput.placeholder   = "Name + Colorway + Year...";
        }
    }
}

function generateButtons() {
    optionsContainer.innerHTML = "";
    const diff        = difficulties[difficultyIndex];
    const correctText = formatSneakerText(currentSneaker, diff);

    const sameBrandSneakers = sneakers.filter(s => s.marca.toLowerCase() === currentSneaker.marca.toLowerCase());
    let brandDistractors = [...new Set(sameBrandSneakers.map(s => formatSneakerText(s, diff)))]
        .filter(text => text !== correctText);
    brandDistractors.sort(() => Math.random() - 0.5);

    let selectedDistractors = [];
    if (brandDistractors.length >= 3) {
        selectedDistractors = brandDistractors.slice(0, 3);
    } else {
        selectedDistractors = [...brandDistractors];
        const otherBrandSneakers = sneakers.filter(s => s.marca.toLowerCase() !== currentSneaker.marca.toLowerCase());
        let otherDistractors = [...new Set(otherBrandSneakers.map(s => formatSneakerText(s, diff)))];
        otherDistractors.sort(() => Math.random() - 0.5);
        selectedDistractors = selectedDistractors.concat(otherDistractors.slice(0, 3 - selectedDistractors.length));
    }

    const selectedOptions = [correctText, ...selectedDistractors];
    selectedOptions.sort(() => Math.random() - 0.5);

    selectedOptions.forEach(text => {
        const btn = document.createElement("button");
        btn.classList.add("answer-btn");
        btn.innerText = text;
        btn.onclick   = () => checkAnswer(text);
        optionsContainer.appendChild(btn);
    });
}

sneakerInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") checkAnswer(sneakerInput.value);
});

if (submitBtn) {
    submitBtn.addEventListener("click", () => checkAnswer(sneakerInput.value));
}

// ====
// ESTADÍSTICAS (MODAL)
// ====
async function openStatsModal() {
    statsModal.classList.remove("hidden");

    if (currentUser) {
        // Usuario con sesión: cargar desde Supabase
        const { data } = await supabaseClient
            .from('player_stats')
            .select('game_mode, difficulty, best_streak')
            .eq('user_id', currentUser.id);

        const statsMap = {};
        if (data) {
            data.forEach(row => {
                statsMap[`${row.game_mode}_${row.difficulty}`] = row.best_streak;
            });
        }

        document.getElementById("total-points-val").innerText            = localStorage.getItem("sneaker_total_points") || "0";
        document.getElementById("streak-classic-normal-val").innerText   = statsMap["classic_normal"]  ?? "0";
        document.getElementById("streak-classic-hard-val").innerText     = statsMap["classic_hard"]    ?? "0";
        document.getElementById("streak-classic-expert-val").innerText   = statsMap["classic_expert"]  ?? "0";
        document.getElementById("streak-expert-normal-val").innerText    = statsMap["expert_normal"]   ?? "0";
        document.getElementById("streak-expert-hard-val").innerText      = statsMap["expert_hard"]     ?? "0";
        document.getElementById("streak-expert-expert-val").innerText    = statsMap["expert_expert"]   ?? "0";

    } else {
        // Invitado: cargar desde localStorage
        document.getElementById("total-points-val").innerText            = localStorage.getItem("sneaker_total_points")          || "0";
        document.getElementById("streak-classic-normal-val").innerText   = localStorage.getItem("sneaker_streak_classic_normal")  || "0";
        document.getElementById("streak-classic-hard-val").innerText     = localStorage.getItem("sneaker_streak_classic_hard")    || "0";
        document.getElementById("streak-classic-expert-val").innerText   = localStorage.getItem("sneaker_streak_classic_expert")  || "0";
        document.getElementById("streak-expert-normal-val").innerText    = localStorage.getItem("sneaker_streak_expert_normal")   || "0";
        document.getElementById("streak-expert-hard-val").innerText      = localStorage.getItem("sneaker_streak_expert_hard")     || "0";
        document.getElementById("streak-expert-expert-val").innerText    = localStorage.getItem("sneaker_streak_expert_expert")   || "0";
    }
}

// ====
// LÓGICA DE RESPUESTA
// ====
function checkAnswer(guess) {
    if (isProcessingAnswer) return;
    isProcessingAnswer = true;

    const userAnswer    = guess.toLowerCase().trim();
    const diff          = difficulties[difficultyIndex];
    let isCorrect       = false;

    let validAnswers    = [];
    const correctAnswer = formatSneakerText(currentSneaker, diff).toLowerCase().trim();
    validAnswers.push(correctAnswer);

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
                const colorwayBase = (currentSneaker.colorway || "").toLowerCase().trim();
                validAnswers.push(`${sinClean} ${colorwayBase}`.trim());
            } else if (diff === 'expert') {
                const colorwayBase = (currentSneaker.colorway || "").toLowerCase().trim();
                const elAnioReal   = (currentSneaker.año || currentSneaker.anio || currentSneaker.lanzamiento || "").toString().toLowerCase().trim();
                validAnswers.push(`${sinClean} ${colorwayBase} ${elAnioReal}`.trim());
            }
        });
    }

    if (gameMode === 'classic') {
        isCorrect = (userAnswer === correctAnswer);
    } else {
        isCorrect = validAnswers.includes(userAnswer);

        if (!isCorrect) {
            const targetWords  = /\b(high|low|mid)\b/gi;
            const cleanUser    = userAnswer.replace(targetWords, '').replace(/\s+/g, ' ').trim();
            const cleanValids  = validAnswers.map(ans => ans.replace(targetWords, '').replace(/\s+/g, ' ').trim());
            isCorrect = cleanValids.includes(cleanUser);
        }
    }

    const respuestaRevelada = formatSneakerText(currentSneaker, diff);

    if (isCorrect) {
        score++;
        score = parseInt(scoreVal.innerText) + 10;
        currentStreak++;

        // Guardar puntos totales en localStorage (funciona tanto para invitados como usuarios)
        let totalPointsSaved = parseInt(localStorage.getItem("sneaker_total_points") || "0");
        totalPointsSaved += 10;
        localStorage.setItem("sneaker_total_points", totalPointsSaved);

        // Comprobar si es un nuevo récord local
        const keyModo             = `${gameMode}_${diff}`;
        const recordRachaGuardada = parseInt(localStorage.getItem(`sneaker_streak_${keyModo}`) || "0");

        if (currentStreak > recordRachaGuardada) {
            localStorage.setItem(`sneaker_streak_${keyModo}`, currentStreak);

            // Si hay sesión activa, sincronizar con Supabase
            if (currentUser) {
                saveStatToSupabase(gameMode, diff, currentStreak).catch(console.error);
            }
        }

        feedbackToast.innerText = dictionary[currentLang].correctToast(currentStreak);
        feedbackToast.className = "feedback-banner correct";
        feedbackToast.classList.remove("hidden");

    } else {
        currentStreak = 0;

        feedbackToast.innerText = dictionary[currentLang].incorrectToast;
        feedbackToast.className = "feedback-banner incorrect";
        feedbackToast.classList.remove("hidden");

        feedbackDetails.innerHTML = `${dictionary[currentLang].exactAnswerWas}<br><strong>${respuestaRevelada}</strong>`;
        feedbackDetails.classList.remove("hidden");
    }

    scoreVal.innerText = score;

    feedbackTimeout = setTimeout(() => {
        feedbackToast.classList.add("hidden");
        feedbackDetails.classList.add("hidden");
        isProcessingAnswer = false;
        nextQuestion();
    }, 2000);
}

// ====
// DICCIONARIOS DE TRADUCCIÓN
// ====
const dictionary = {
    es: {
        scoreText:          "PUNTOS",
        playBtn:            "JUGAR",
        gameModeBtn:        "MODO DE JUEGO",
        authBtn:            "🔐 INICIAR SESIÓN",
        submitGuessBtn:     "ADIVINAR",
        backToMenuBtn:      "VOLVER AL MENÚ",
        helloText:          "HOLA",
        logoutText:         "SALIR",
        statsTitle:         "📊 MIS RÉCORDS",
        totalPointsLabel:   "PUNTOS TOTALES (DE SIEMPRE)",
        gameSettingsTitle:  "⚙️ AJUSTES DE PARTIDA",
        gameModeHeading:    "MODO DE JUEGO",
        difficultyHeading:  "DIFICULTAD",
        infoTitle:          "ℹ️ ¿CÓMO JUGAR?",
        infoBody:           `<p style="margin-bottom:15px;text-align:center;font-weight:600;color:#ff6a00;">¡Demuestra tus conocimientos de cultura sneakerhead adivinando el calzado de la imagen!</p><hr style="border:0;height:1px;background:#333;margin-bottom:15px;"><h3 style="color:#fff;font-size:15px;margin-bottom:5px;">🕹️ MODOS DE JUEGO</h3><ul style="margin-left:20px;margin-bottom:15px;padding-left:5px;"><li><strong>Classic:</strong> Elige la respuesta correcta entre 4 opciones.</li><li><strong>Expert:</strong> Escribe la respuesta exacta.</li></ul><h3 style="color:#fff;font-size:15px;margin-bottom:5px;">🔥 DIFICULTADES</h3><ul style="margin-left:20px;padding-left:5px;"><li><strong style="color:#2ecc71;">Normal:</strong> Solo el nombre del modelo.</li><li><strong style="color:#f1c40f;">Hard:</strong> Nombre + Colorway.</li><li><strong style="color:#e74c3c;">Expert:</strong> Nombre + Colorway + Año.</li></ul>`,
        correctToast:       (streak) => `✅ ¡Correcto! (Racha: ${streak})`,
        incorrectToast:     "❌ ¡Fallaste!",
        exactAnswerWas:     "La respuesta exacta era:",
        emptyJsonAlert:     "El archivo zapatillas.json parece estar vacío.",
        criticalErrorAlert: "Error crítico al cargar zapatillas.json. Abre index.html usando 'Live Server'.",
        shareMessage:       (streak, points) => `¡Llevo una racha de ${streak} aciertos y ${points} puntos en SneakerGuessr! ¿Podrás superarme? 👟🔥 Juega gratis aquí: https://sneakerguessr.com`,
        copiedAlert:        "📋 ¡Texto de compartir copiado al portapapeles!"
    },
    en: {
        scoreText:          "SCORE",
        playBtn:            "PLAY",
        gameModeBtn:        "GAME MODE",
        authBtn:            "🔐 LOG IN",
        submitGuessBtn:     "GUESS",
        backToMenuBtn:      "BACK TO MENU",
        helloText:          "HELLO",
        logoutText:         "LOGOUT",
        statsTitle:         "📊 MY RECORDS",
        totalPointsLabel:   "TOTAL POINTS (ALL TIME)",
        gameSettingsTitle:  "⚙️ GAME SETTINGS",
        gameModeHeading:    "GAME MODE",
        difficultyHeading:  "DIFFICULTY",
        infoTitle:          "ℹ️ HOW TO PLAY?",
        infoBody:           `<p style="margin-bottom:15px;text-align:center;font-weight:600;color:#ff6a00;">Prove your sneakerhead culture knowledge by guessing the footwear in the picture!</p><hr style="border:0;height:1px;background:#333;margin-bottom:15px;"><h3 style="color:#fff;font-size:15px;margin-bottom:5px;">🕹️ GAME MODES</h3><ul style="margin-left:20px;margin-bottom:15px;padding-left:5px;"><li><strong>Classic:</strong> Choose the correct answer from 4 options.</li><li><strong>Expert:</strong> Type the exact answer.</li></ul><h3 style="color:#fff;font-size:15px;margin-bottom:5px;">🔥 DIFFICULTY LEVELS</h3><ul style="margin-left:20px;padding-left:5px;"><li><strong style="color:#2ecc71;">Normal:</strong> Model name only.</li><li><strong style="color:#f1c40f;">Hard:</strong> Name + Colorway.</li><li><strong style="color:#e74c3c;">Expert:</strong> Name + Colorway + Year.</li></ul>`,
        correctToast:       (streak) => `✅ Correct! (Streak: ${streak})`,
        incorrectToast:     "❌ Incorrect!",
        exactAnswerWas:     "The exact answer was:",
        emptyJsonAlert:     "The file zapatillas.json appears to be empty.",
        criticalErrorAlert: "Critical error loading zapatillas.json. Open index.html using 'Live Server'.",
        shareMessage:       (streak, points) => `I'm on a streak of ${streak} correct answers and ${points} points on SneakerGuessr! Can you beat me? 👟🔥 Play free here: https://sneakerguessr.com`,
        copiedAlert:        "📋 Sharing text copied to clipboard!"
    }
};

let currentLang = localStorage.getItem("sneaker_lang") || "es";

// ====
// IDIOMA
// ====
function applyLanguage(lang) {
    const texts = dictionary[lang];

    const el = (id) => document.getElementById(id);

    if (el("score-text"))         el("score-text").innerText         = texts.scoreText;
    if (el("play-btn"))           el("play-btn").innerText           = texts.playBtn;
    if (el("game-mode-setup-btn")) el("game-mode-setup-btn").innerText = texts.gameModeBtn;
    if (el("submit-guess"))       el("submit-guess").innerText       = texts.submitGuessBtn;
    if (el("back-to-menu-btn"))   el("back-to-menu-btn").innerText   = texts.backToMenuBtn;

    if (el("tab-login-btn"))    el("tab-login-btn").innerText    = lang === 'es' ? "INICIAR SESIÓN" : "LOG IN";
    if (el("tab-register-btn")) el("tab-register-btn").innerText = lang === 'es' ? "REGISTRARSE"    : "SIGN UP";

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

    const langBtn = el("lang-btn");
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
    const currentScore      = parseInt(scoreVal.innerText) || 0;
    const currentStreakVal  = currentStreak || 0;
    const textToShare       = dictionary[currentLang].shareMessage(currentStreakVal, currentScore);

    if (navigator.share) {
        try {
            await navigator.share({ title: 'SneakerGuessr', text: textToShare, url: 'https://sneakerguessr.com' });
        } catch (err) {
            console.log("Compartir cancelado:", err);
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

// ====
// INICIALIZACIÓN (esperar a que el DOM esté listo)
// ====
document.addEventListener("DOMContentLoaded", () => {
    applyLanguage(currentLang);
    initAuth(); // Arrancar el sistema de autenticación Supabase
});