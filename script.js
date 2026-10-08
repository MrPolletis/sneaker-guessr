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

// ==========================================
// CONFIGURACIÓN DE PROGRAMAS DE AFILIADOS
// Para activar comisiones reales, introduce tu ID en cada plataforma:
// ==========================================
const AFFILIATE_CONFIG = {
    // Impact.com (StockX)
    stockx: {
        partnerId: "",
        campaignId: "",
        buildUrl: (sneaker) => {
            const query = encodeURIComponent(`${sneaker.nombre} ${sneaker.colorway}`.trim());
            return `https://stockx.com/search?s=${query}`;
        }
    },
    // GOAT (CJ Affiliate / Directo)
    goat: {
        affiliateId: "",
        buildUrl: (sneaker) => {
            const query = encodeURIComponent(`${sneaker.nombre} ${sneaker.colorway}`.trim());
            return `https://www.goat.com/search?query=${query}`;
        }
    },
    // KLEKT (Awin / Directo)
    klekt: {
        awinId: "",
        buildUrl: (sneaker) => {
            const query = encodeURIComponent(`${sneaker.nombre} ${sneaker.colorway}`.trim());
            return `https://www.klekt.com/search?q=${query}`;
        }
    },
    // eBay Sneakers Authenticity Guarantee (eBay Partner Network - EPN)
    ebay: {
        campId: "",
        buildUrl: (sneaker) => {
            const query = encodeURIComponent(`${sneaker.nombre} ${sneaker.colorway}`.trim());
            return `https://www.ebay.com/sch/i.html?_nkw=${query}&_sacat=15709`;
        }
    }
};

/**
 * Devuelve un objeto con las URLs de compra para la zapatilla dada.
 */
function getAffiliateUrls(sneaker) {
    if (!sneaker) return { stockx: "#", goat: "#", klekt: "#", ebay: "#" };
    return {
        stockx: AFFILIATE_CONFIG.stockx.buildUrl(sneaker),
        goat:   AFFILIATE_CONFIG.goat.buildUrl(sneaker),
        klekt:  AFFILIATE_CONFIG.klekt.buildUrl(sneaker),
        ebay:   AFFILIATE_CONFIG.ebay.buildUrl(sneaker)
    };
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

// CATÁLOGO SNEAKERDEX
const catalogBtn            = document.getElementById("catalog-btn");
const catalogModal          = document.getElementById("catalog-modal");
const closeCatalogBtn       = document.getElementById("close-catalog-btn");
const catalogSearch         = document.getElementById("catalog-search");
const catalogBrandFilter    = document.getElementById("catalog-brand-filter");
const catalogCount          = document.getElementById("catalog-count");
const catalogGrid           = document.getElementById("catalog-grid");

// TARJETA DE AFILIADOS TRAS RESPONDER
const affiliateCard         = document.getElementById("affiliate-card");
const affiliateLabel        = document.getElementById("affiliate-label");
const affiliateNextBtn      = document.getElementById("affiliate-next-btn");
const linkStockx            = document.getElementById("link-stockx");
const linkGoat              = document.getElementById("link-goat");
const linkKlekt             = document.getElementById("link-klekt");
const linkEbay              = document.getElementById("link-ebay");
const affiliateDisclosure   = document.getElementById("affiliate-disclosure");

const filterScopeContainer  = document.getElementById("filter-scope-container");
const filterTypeContainer   = document.getElementById("filter-type-container");
const filterModeGroup       = document.getElementById("filter-mode-group");
const filterDiffGroup       = document.getElementById("filter-diff-group");
const filterModeContainer   = document.getElementById("filter-mode-container");
const filterDiffContainer   = document.getElementById("filter-diff-container");
const scopeLocalBtn         = document.getElementById("scope-local-btn");
const thScore               = document.getElementById("th-score");

const authModal             = document.getElementById("auth-modal");
const closeAuthBtn          = document.getElementById("close-auth-btn");
const authLoggedView        = document.getElementById("auth-logged-view");
const authGuestView         = document.getElementById("auth-guest-view");
const loggedUsernameDisplay = document.getElementById("logged-username-display");
const loggedStatsDisplay    = document.getElementById("logged-stats-display");
const btnModalLogout        = document.getElementById("btn-modal-logout");
const btnModalDeleteLogged  = document.getElementById("btn-modal-delete-logged");

const tabLoginBtn           = document.getElementById("tab-login-btn");
const tabRegisterBtn        = document.getElementById("tab-register-btn");
const tabDeleteBtn          = document.getElementById("tab-delete-btn");
const loginForm             = document.getElementById("login-form");
const registerForm          = document.getElementById("register-form");
const deleteForm            = document.getElementById("delete-form");

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

// ELEMENTOS MODO MULTIJUGADOR 1 VS 1 (ESTILO KAHOOT)
const multiplayerBtn        = document.getElementById("multiplayer-btn");
const multiplayerScreen     = document.getElementById("multiplayer-screen");
const mpLobbyModal          = document.getElementById("mp-lobby-modal");
const closeMpLobbyBtn       = document.getElementById("close-mp-lobby-btn");
const tabMpMatchmaking      = document.getElementById("tab-mp-matchmaking");
const tabMpFriend           = document.getElementById("tab-mp-friend");
const mpViewMatchmaking     = document.getElementById("mp-view-matchmaking");
const mpViewFriend          = document.getElementById("mp-view-friend");
const btnStartMatchmaking   = document.getElementById("btn-start-matchmaking");
const mpRadarBox            = document.getElementById("mp-radar-box");
const mpStartMatchmakingBox = document.getElementById("mp-start-matchmaking-box");
const mpQueueTimer          = document.getElementById("mp-queue-timer");
const mpRadarStatus         = document.getElementById("mp-radar-status");
const mpCancelMatchmakingBtn= document.getElementById("mp-cancel-matchmaking-btn");
const btnCreateRoom         = document.getElementById("btn-create-room");
const mpCreatedRoomBox      = document.getElementById("mp-created-room-box");
const mpRoomCodeDisplay     = document.getElementById("mp-room-code-display");
const btnCopyInvite         = document.getElementById("btn-copy-invite");
const mpInputRoomCode       = document.getElementById("mp-input-room-code");
const btnJoinRoom           = document.getElementById("btn-join-room");
const mpResultsModal        = document.getElementById("mp-results-modal");
const mpBtnRematch          = document.getElementById("mp-btn-rematch");
const mpBtnBackMenu         = document.getElementById("mp-btn-back-menu");
const mpLeaveBtn            = document.getElementById("mp-leave-btn");

const mpLocalName           = document.getElementById("mp-local-name");
const mpLocalScore          = document.getElementById("mp-local-score");
const mpLocalBar            = document.getElementById("mp-local-bar");
const mpLocalStatus         = document.getElementById("mp-local-status");
const mpRivalName           = document.getElementById("mp-rival-name");
const mpRivalScore          = document.getElementById("mp-rival-score");
const mpRivalBar            = document.getElementById("mp-rival-bar");
const mpRivalStatus         = document.getElementById("mp-rival-status");
const mpTimerVal            = document.getElementById("mp-timer-val");
const mpTimerCircle         = document.getElementById("mp-timer-circle");
const mpRoundIndicator      = document.getElementById("mp-round-indicator");
const mpSneakerImg          = document.getElementById("mp-sneaker-img");
const mpRoundFeedback       = document.getElementById("mp-round-feedback");
const mpOptionsContainer     = document.getElementById("mp-options-container");

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
let selectedFilterScope = "global"; // 'global' | 'local'
let selectedFilterType  = "points"; // 'points' | 'streak'
let selectedFilterMode  = "classic";
let selectedFilterDiff  = "normal";

// Estado multijugador 1 vs 1
let mpChannel               = null;
let mpMatchmakingChannel    = null;
let mpRoomCode              = null;
let mpIsHost                = false;
let mpIsBot                 = false;
let mpRivalUsername         = "Rival";
let mpLocalPoints           = 0;
let mpRivalPoints           = 0;
let mpRound                 = 0;
let mpSneakersList          = [];
let mpCurrentIndex          = 0;
let mpTimerInterval         = null;
let mpTimeLeft              = 10;
let mpAnswerLocked          = false;
let mpRivalAnswered         = false;
let mpBotTimeout            = null;
let mpMatchmakingTimeout    = null;
let mpQueueInterval         = null;
let mpQueueSeconds          = 0;
let mpConfettiAnimationId   = null;

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
 * Carga los datos del perfil (username, country, total_points) desde la tabla 'profiles'.
 * Sincroniza los puntos entre la nube y el dispositivo local.
 * Si el usuario se registró antes y no tenía fila en 'profiles', la crea automáticamente.
 */
async function loadProfileData() {
    if (!currentUser) return;
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (error) {
            console.error("Error al consultar profiles:", error);
        }

        if (data) {
            profileData = data;

            // Sincronizar puntos totales: si la nube tiene más puntos, actualizar local.
            // Si el dispositivo acumuló puntos jugando como invitado, actualizar la nube con el máximo.
            const cloudPoints = Number(data.total_points) || 0;
            const localPoints = Number(localStorage.getItem("sneaker_total_points")) || 0;
            const finalPoints = Math.max(cloudPoints, localPoints);

            localStorage.setItem("sneaker_total_points", finalPoints);
            profileData.total_points = finalPoints;

            if (finalPoints > cloudPoints) {
                await supabaseClient
                    .from('profiles')
                    .update({ total_points: finalPoints })
                    .eq('id', currentUser.id);
            }
        } else {
            // AUTORREPARACIÓN: Usuario autenticado pero sin fila en 'profiles'
            const meta = currentUser.user_metadata || {};
            const cleanUser = meta.username
                || (currentUser.email ? currentUser.email.replace(AUTH_EMAIL_DOMAIN, '') : "SneakerPlayer");
            const cleanCountry = meta.country || "ES";
            const localPoints = Number(localStorage.getItem("sneaker_total_points")) || 0;

            const { data: newProfile, error: upsertErr } = await supabaseClient
                .from('profiles')
                .upsert({
                    id:           currentUser.id,
                    username:     cleanUser,
                    country:      cleanCountry,
                    total_points: localPoints
                }, { onConflict: 'id' })
                .select()
                .maybeSingle();

            if (!upsertErr && newProfile) {
                profileData = newProfile;
            } else {
                profileData = {
                    id:           currentUser.id,
                    username:     cleanUser,
                    country:      cleanCountry,
                    total_points: localPoints
                };
            }
        }

        updateHeaderScore();
        updateAuthButton();
    } catch (err) {
        console.error("Error al cargar perfil de Supabase:", err);
    }
}

/**
 * Guarda los puntos totales permanentemente en Supabase (usando upsert para garantizar persistencia).
 */
async function savePointsToSupabase(points) {
    if (!currentUser) return;
    try {
        const meta = currentUser.user_metadata || {};
        const username = (profileData && profileData.username)
            || meta.username
            || (currentUser.email ? currentUser.email.replace(AUTH_EMAIL_DOMAIN, '') : "SneakerPlayer");
        const country = (profileData && profileData.country)
            || meta.country
            || "ES";

        await supabaseClient
            .from('profiles')
            .upsert({
                id:           currentUser.id,
                username:     username,
                country:      country,
                total_points: points
            }, { onConflict: 'id' });

        if (profileData) {
            profileData.total_points = points;
        }
    } catch (err) {
        console.error("Error al guardar puntos en Supabase:", err);
    }
}

/**
 * Actualiza el indicador de puntuación superior (Header)
 * - En partida activa: Puntos de la partida actual (SCORE: X)
 * - En menú principal: Puntos totales acumulados (TOTAL: X,XXX)
 */
function updateHeaderScore() {
    const scoreTextEl = document.getElementById("score-text");
    const scoreValEl  = document.getElementById("score-val");
    if (!scoreTextEl || !scoreValEl) return;

    if (gameScreen && !gameScreen.classList.contains("hidden")) {
        scoreTextEl.innerText = dictionary[currentLang] ? dictionary[currentLang].scoreText : "SCORE";
        scoreValEl.innerText  = score;
    } else {
        scoreTextEl.innerText = dictionary[currentLang] && dictionary[currentLang].totalText ? dictionary[currentLang].totalText : "TOTAL";
        const totalPts = (profileData && profileData.total_points != null)
            ? profileData.total_points
            : (Number(localStorage.getItem("sneaker_total_points")) || 0);
        scoreValEl.innerText  = Number(totalPts).toLocaleString();
    }
}

/**
 * Actualiza el botón de autenticación del menú según el estado de sesión
 * y adapta el botón de clasificación LOCAL al país del jugador.
 */
function updateAuthButton() {
    if (currentUser && profileData) {
        authBtn.innerText = `👤 @${profileData.username}`;
        authBtn.classList.add("logged-in");
        authBtn.style.background = "";
        if (scopeLocalBtn) {
            scopeLocalBtn.innerText = `📍 LOCAL (${profileData.country || 'ES'})`;
        }
    } else {
        authBtn.innerText = dictionary[currentLang] ? dictionary[currentLang].authBtn : "🔐 INICIAR SESIÓN";
        authBtn.classList.remove("logged-in");
        authBtn.style.background = "linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)";
        if (scopeLocalBtn) {
            scopeLocalBtn.innerText = `📍 LOCAL`;
        }
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

// Filtros de Ámbito (Global / Local)
if (filterScopeContainer) {
    filterScopeContainer.querySelectorAll(".btn-filter-opt").forEach(btn => {
        btn.addEventListener("click", (e) => {
            filterScopeContainer.querySelectorAll(".btn-filter-opt").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            selectedFilterScope = e.currentTarget.getAttribute("data-filter-scope");
            renderLeaderboard();
        });
    });
}

// Filtros de Tipo (Puntos / Racha)
if (filterTypeContainer) {
    filterTypeContainer.querySelectorAll(".btn-filter-opt").forEach(btn => {
        btn.addEventListener("click", (e) => {
            filterTypeContainer.querySelectorAll(".btn-filter-opt").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            selectedFilterType = e.currentTarget.getAttribute("data-filter-type");

            if (selectedFilterType === 'points') {
                if (filterModeGroup) filterModeGroup.classList.add("hidden");
                if (filterDiffGroup) filterDiffGroup.classList.add("hidden");
            } else {
                if (filterModeGroup) filterModeGroup.classList.remove("hidden");
                if (filterDiffGroup) {
                    if (selectedFilterMode === 'classic') {
                        filterDiffGroup.classList.add("hidden");
                    } else {
                        filterDiffGroup.classList.remove("hidden");
                    }
                }
            }

            renderLeaderboard();
        });
    });
}

// Filtros de modo (Classic / Expert)
if (filterModeContainer) {
    filterModeContainer.querySelectorAll(".btn-filter-opt").forEach(btn => {
        btn.addEventListener("click", (e) => {
            filterModeContainer.querySelectorAll(".btn-filter-opt").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            selectedFilterMode = e.currentTarget.getAttribute("data-filter-mode");
            if (filterDiffGroup) {
                if (selectedFilterMode === 'classic') {
                    filterDiffGroup.classList.add("hidden");
                } else {
                    filterDiffGroup.classList.remove("hidden");
                }
            }
            renderLeaderboard();
        });
    });
}

// Filtros de dificultad (Normal / Hard / Expert)
if (filterDiffContainer) {
    filterDiffContainer.querySelectorAll(".btn-filter-opt").forEach(btn => {
        btn.addEventListener("click", (e) => {
            filterDiffContainer.querySelectorAll(".btn-filter-opt").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            selectedFilterDiff = e.currentTarget.getAttribute("data-filter-diff");
            renderLeaderboard();
        });
    });
}

// Abre el modal de autenticación adaptado al estado del usuario (sesión activa o invitado)
function openAuthModal() {
    resetAuthFormErrors();
    if (currentUser && profileData) {
        if (authLoggedView) authLoggedView.classList.remove("hidden");
        if (authGuestView)  authGuestView.classList.add("hidden");
        if (loggedUsernameDisplay) loggedUsernameDisplay.textContent = `@${profileData.username}`;
        if (loggedStatsDisplay) {
            loggedStatsDisplay.textContent = currentLang === 'es'
                ? `País: ${profileData.country || 'ES'} | Puntos totales: ${Number(profileData.total_points || 0).toLocaleString()} ⭐`
                : `Country: ${profileData.country || 'ES'} | Total points: ${Number(profileData.total_points || 0).toLocaleString()} ⭐`;
        }
    } else {
        if (authLoggedView) authLoggedView.classList.add("hidden");
        if (authGuestView)  authGuestView.classList.remove("hidden");
        if (tabLoginBtn)    tabLoginBtn.click();
    }
    authModal.classList.remove("hidden");
}

authBtn.addEventListener("click", openAuthModal);
closeAuthBtn.addEventListener("click", () => authModal.classList.add("hidden"));

function resetAuthFormErrors() {
    const loginErr = document.getElementById("login-error");
    const regErr   = document.getElementById("register-error");
    const delErr   = document.getElementById("delete-error");
    if (loginErr) { loginErr.classList.add("hidden"); loginErr.textContent = ""; }
    if (regErr)   { regErr.classList.add("hidden");   regErr.textContent = ""; }
    if (delErr)   { delErr.classList.add("hidden");   delErr.textContent = ""; }
}

// Pestañas Login / Registro / Eliminar
if (tabLoginBtn) {
    tabLoginBtn.addEventListener("click", () => {
        tabLoginBtn.classList.add("active");
        if (tabRegisterBtn) tabRegisterBtn.classList.remove("active");
        if (tabDeleteBtn)   tabDeleteBtn.classList.remove("active");
        if (loginForm)      loginForm.classList.remove("hidden");
        if (registerForm)   registerForm.classList.add("hidden");
        if (deleteForm)     deleteForm.classList.add("hidden");
        resetAuthFormErrors();
    });
}

if (tabRegisterBtn) {
    tabRegisterBtn.addEventListener("click", () => {
        tabRegisterBtn.classList.add("active");
        if (tabLoginBtn)    tabLoginBtn.classList.remove("active");
        if (tabDeleteBtn)   tabDeleteBtn.classList.remove("active");
        if (registerForm)   registerForm.classList.remove("hidden");
        if (loginForm)      loginForm.classList.add("hidden");
        if (deleteForm)     deleteForm.classList.add("hidden");
        resetAuthFormErrors();
    });
}

if (tabDeleteBtn) {
    tabDeleteBtn.addEventListener("click", () => {
        tabDeleteBtn.classList.add("active");
        if (tabLoginBtn)    tabLoginBtn.classList.remove("active");
        if (tabRegisterBtn) tabRegisterBtn.classList.remove("active");
        if (deleteForm)     deleteForm.classList.remove("hidden");
        if (loginForm)      loginForm.classList.add("hidden");
        if (registerForm)   registerForm.classList.add("hidden");
        resetAuthFormErrors();
    });
}

// Salir de la cuenta desde la vista de usuario identificado
if (btnModalLogout) {
    btnModalLogout.addEventListener("click", async () => {
        await supabaseClient.auth.signOut();
        currentUser = null;
        profileData = null;
        updateAuthButton();
        updateHeaderScore();
        authModal.classList.add("hidden");
    });
}

/**
 * Elimina la cuenta del usuario en Supabase y limpia el almacenamiento local.
 */
async function performAccountDeletion(userId) {
    try {
        // 1. Invocar función RPC para eliminar completamente en auth.users si existe
        try {
            await supabaseClient.rpc('delete_user_account');
        } catch (rpcErr) {
            console.log("Nota sobre rpc delete_user_account:", rpcErr);
        }

        // 2. Borrar datos de player_stats y profiles en Supabase
        await supabaseClient.from('player_stats').delete().eq('user_id', userId);
        await supabaseClient.from('profiles').delete().eq('id', userId);

        // 3. Cerrar sesión
        await supabaseClient.auth.signOut();

        // 4. Limpiar almacenamiento local
        localStorage.removeItem("sneaker_total_points");
        localStorage.setItem("sneaker_total_points", "0");

        // 5. Limpiar estado en memoria
        currentUser = null;
        profileData = null;
        score = 0;

        // 6. Actualizar UI
        updateAuthButton();
        updateHeaderScore();
        authModal.classList.add("hidden");

        // 7. Notificar al usuario
        alert(dictionary[currentLang].delSuccess);
    } catch (err) {
        console.error("Error al eliminar la cuenta:", err);
        alert(dictionary[currentLang].delError);
    }
}

// Eliminar cuenta para usuario con sesión activa
if (btnModalDeleteLogged) {
    btnModalDeleteLogged.addEventListener("click", async () => {
        if (!currentUser) return;
        const confirmed = confirm(dictionary[currentLang].delConfirm);
        if (!confirmed) return;

        btnModalDeleteLogged.disabled = true;
        btnModalDeleteLogged.textContent = currentLang === 'es' ? "Eliminando..." : "Deleting...";

        await performAccountDeletion(currentUser.id);

        btnModalDeleteLogged.disabled = false;
        btnModalDeleteLogged.textContent = dictionary[currentLang].delLoggedBtn;
    });
}

// Eliminar cuenta desde el formulario (cuando no hay sesión activa o se ingresan credenciales)
if (deleteForm) {
    deleteForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const errorEl = document.getElementById("delete-error");
        errorEl.classList.add("hidden");
        errorEl.textContent = "";

        const rawUsername = document.getElementById("del-username").value;
        const usernameVal = normalizeUsername(rawUsername);
        const passVal     = document.getElementById("del-password").value;

        if (!usernameVal || !passVal) {
            errorEl.textContent = currentLang === 'es' ? "Rellena todos los campos." : "Fill in all fields.";
            errorEl.classList.remove("hidden");
            return;
        }

        const submitDelBtn = document.getElementById("btn-submit-del");
        submitDelBtn.disabled = true;
        submitDelBtn.textContent = currentLang === 'es' ? "Verificando..." : "Verifying...";

        const authEmail = usernameToAuthEmail(usernameVal);

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email:    authEmail,
            password: passVal
        });

        if (error || !data || !data.user) {
            errorEl.textContent = dictionary[currentLang].delWrongCreds;
            errorEl.classList.remove("hidden");
            submitDelBtn.disabled = false;
            submitDelBtn.textContent = currentLang === 'es' ? "ELIMINAR DEFINITIVAMENTE" : "DELETE PERMANENTLY";
            return;
        }

        const confirmed = confirm(dictionary[currentLang].delConfirm);
        if (!confirmed) {
            await supabaseClient.auth.signOut();
            submitDelBtn.disabled = false;
            submitDelBtn.textContent = currentLang === 'es' ? "ELIMINAR DEFINITIVAMENTE" : "DELETE PERMANENTLY";
            return;
        }

        submitDelBtn.textContent = currentLang === 'es' ? "Eliminando..." : "Deleting...";
        await performAccountDeletion(data.user.id);

        deleteForm.reset();
        submitDelBtn.disabled = false;
        submitDelBtn.textContent = currentLang === 'es' ? "ELIMINAR DEFINITIVAMENTE" : "DELETE PERMANENTLY";
    });
}

// ====
// REGISTRO — SUPABASE
// ====
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const errorEl = document.getElementById("register-error");
    errorEl.classList.add("hidden");
    errorEl.textContent = "";

    // El @ es solo visual: @Juanitopro67 y Juanitopro67 son la misma cuenta.
    const rawUsername = document.getElementById("reg-username").value;
    const usernameVal = normalizeUsername(rawUsername);
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
            data: { username: usernameVal, country: countryVal }
        }
    });

    if (error) {
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

    // Crear fila en la tabla 'profiles' conservando los puntos acumulados como invitado
    if (data && data.user) {
        currentUser = data.user;
        const initialPoints = parseInt(localStorage.getItem("sneaker_total_points") || "0");
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .upsert({
                id:           data.user.id,
                username:     usernameVal,
                country:      countryVal,
                total_points: initialPoints
            }, { onConflict: 'id' });

        if (profileError) {
            console.warn("Perfil ya existe o error al crearlo:", profileError.message);
        } else {
            profileData = { id: data.user.id, username: usernameVal, country: countryVal, total_points: initialPoints };
        }
        updateAuthButton();
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

    const rawUsername = document.getElementById("login-username").value;
    const usernameVal = normalizeUsername(rawUsername);
    const passVal     = document.getElementById("login-password").value;

    if (!usernameVal || !passVal) {
        errorEl.textContent = currentLang === 'es' ? "Rellena todos los campos." : "Fill in all fields.";
        errorEl.classList.remove("hidden");
        return;
    }

    const submitLoginBtn = document.getElementById("btn-submit-login");
    submitLoginBtn.disabled = true;
    submitLoginBtn.textContent = currentLang === 'es' ? "Entrando..." : "Logging in...";

    const authEmail = usernameToAuthEmail(usernameVal);

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email:    authEmail,
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

    if (data && data.user) {
        currentUser = data.user;
        await loadProfileData();
        updateAuthButton();
    }

    loginForm.reset();
    authModal.classList.add("hidden");
    submitLoginBtn.disabled = false;
    submitLoginBtn.textContent = currentLang === 'es' ? "ENTRAR" : "LOG IN";
});

// ====
// CIERRE DE MODALES AL CLICAR FUERA
// ====
window.addEventListener("click", (e) => {
    if (e.target === statsModal)        statsModal.classList.add("hidden");
    if (e.target === gameModeModal)     gameModeModal.classList.add("hidden");
    if (e.target === infoModal)         infoModal.classList.add("hidden");
    if (e.target === leaderboardModal)  leaderboardModal.classList.add("hidden");
    if (e.target === authModal)         authModal.classList.add("hidden");
    if (e.target === catalogModal)      catalogModal.classList.add("hidden");
    if (e.target === mpLobbyModal)      closeMpLobby();
});

backToMenuBtn.addEventListener("click", () => {
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
    isProcessingAnswer = false;
    feedbackToast.classList.add("hidden");
    feedbackDetails.classList.add("hidden");
    if (affiliateCard) affiliateCard.classList.add("hidden");
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
    updateHeaderScore();
});

// ====
// AJUSTES DE PARTIDA
// ====
optModeClassic.addEventListener("click", () => {
    gameMode = 'classic';
    difficultyIndex = 0;
    currentStreak = 0;
    updateModalUI();
    if (!gameScreen.classList.contains("hidden")) { prepareGamePool(); nextQuestion(); }
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
        .forEach(b => { if (b) b.classList.remove("active"); });

    const diffGroup   = document.getElementById("difficulty-settings-group");
    const classicNote = document.getElementById("classic-mode-note");

    if (gameMode === 'classic') {
        if (optModeClassic) optModeClassic.classList.add("active");
        if (diffGroup)   diffGroup.classList.add("hidden");
        if (classicNote) classicNote.classList.remove("hidden");
        difficultyIndex = 0;
    } else {
        if (optModeExpert) optModeExpert.classList.add("active");
        if (diffGroup)   diffGroup.classList.remove("hidden");
        if (classicNote) classicNote.classList.add("hidden");
    }

    if      (difficultyIndex === 0 && optDiffNormal) optDiffNormal.classList.add("active");
    else if (difficultyIndex === 1 && optDiffHard)   optDiffHard.classList.add("active");
    else if (difficultyIndex === 2 && optDiffExpert) optDiffExpert.classList.add("active");
}

// ====
// LEADERBOARD — SUPABASE (GLOBAL Y LOCAL)
// ====
async function renderLeaderboard() {
    leaderboardBody.innerHTML = `
        <tr>
            <td colspan="4" style="text-align:center; padding:20px; color:#888;">
                ⏳ ${currentLang === 'es' ? 'Cargando ranking...' : 'Loading ranking...'}
            </td>
        </tr>`;

    // Actualizar texto de la columna de resultado
    if (thScore) {
        if (selectedFilterType === 'points') {
            thScore.innerText = currentLang === 'es' ? "Puntos" : "Points";
        } else {
            thScore.innerText = currentLang === 'es' ? "Racha Máx." : "Max Streak";
        }
    }

    try {
        let entries = [];
        const userCountry = (profileData && profileData.country) ? profileData.country : "ES";

        if (selectedFilterType === 'points') {
            // CLASIFICACIÓN POR PUNTOS TOTALES (tabla 'profiles')
            let query = supabaseClient
                .from('profiles')
                .select('id, username, country, total_points')
                .gt('total_points', 0)
                .order('total_points', { ascending: false })
                .limit(10);

            if (selectedFilterScope === 'local') {
                query = query.eq('country', userCountry);
            }

            const { data, error } = await query;
            if (error) throw error;

            entries = (data || []).map(item => ({
                id: item.id,
                username: item.username,
                country: item.country,
                scoreDisplay: `${Number(item.total_points).toLocaleString()} ⭐`
            }));

        } else {
            // CLASIFICACIÓN POR RACHAS (tabla 'player_stats' unida a 'profiles')
            const diffToQuery = (selectedFilterMode === 'classic') ? 'normal' : selectedFilterDiff;
            let query = supabaseClient
                .from('player_stats')
                .select('best_streak, user_id, profiles!inner(username, country)')
                .eq('game_mode', selectedFilterMode)
                .eq('difficulty', diffToQuery)
                .gt('best_streak', 0)
                .order('best_streak', { ascending: false })
                .limit(10);

            if (selectedFilterScope === 'local') {
                query = query.eq('profiles.country', userCountry);
            }

            const { data, error } = await query;
            if (error) throw error;

            entries = (data || []).map(item => ({
                id: item.user_id,
                username: item.profiles ? item.profiles.username : '???',
                country: item.profiles ? item.profiles.country : '??',
                scoreDisplay: `${item.best_streak} 🔥`
            }));
        }

        leaderboardBody.innerHTML = "";

        if (entries.length === 0) {
            const noDataMsg = selectedFilterScope === 'local'
                ? (currentLang === 'es' ? `Aún no hay récords para ${userCountry}. ¡Sé el primero!` : `No records for ${userCountry} yet. Be the first!`)
                : (currentLang === 'es' ? "Aún no hay puntuaciones registradas." : "No scores recorded yet.");
            leaderboardBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center; padding:20px; color:#888;">
                        ${noDataMsg}
                    </td>
                </tr>`;
            return;
        }

        for (let i = 0; i < 10; i++) {
            const row   = document.createElement("tr");
            const entry = entries[i];

            if (entry) {
                const isMe = currentUser && (entry.id === currentUser.id);

                if (isMe) {
                    row.style.background = "rgba(255, 106, 0, 0.15)";
                    row.style.borderLeft = "3px solid #ff6a00";
                }

                const posCell = document.createElement("td");
                posCell.innerHTML = `<strong>${i + 1}º</strong>`;

                const nameCell = document.createElement("td");
                nameCell.textContent = isMe
                    ? `⭐ @${entry.username} (${currentLang === 'es' ? 'Tú' : 'You'})`
                    : `@${entry.username}`;

                const countryCell = document.createElement("td");
                countryCell.textContent = entry.country || "??";

                const scoreCell = document.createElement("td");
                scoreCell.innerHTML = `<strong>${entry.scoreDisplay}</strong>`;

                row.appendChild(posCell);
                row.appendChild(nameCell);
                row.appendChild(countryCell);
                row.appendChild(scoreCell);
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
                    ❌ ${currentLang === 'es' ? 'Error al cargar el ranking' : 'Error loading ranking'}
                </td>
            </tr>`;
    }
}

// Carga de la base de datos de zapatillas si no se ha cargado todavía
async function ensureSneakersLoaded() {
    if (sneakers && sneakers.length > 0) return sneakers;
    try {
        const response = await fetch('zapatillas.json');
        sneakers = await response.json();
        return sneakers;
    } catch (error) {
        console.error("Error al cargar zapatillas.json:", error);
        return [];
    }
}

// ====
// MOTOR DE JUEGO
// ====
async function startGame() {
    try {
        await ensureSneakersLoaded();

        if (!sneakers || sneakers.length === 0) {
            alert(dictionary[currentLang].emptyJsonAlert);
            return;
        }

        score         = 0;
        currentStreak = 0;
        updateHeaderScore();

        feedbackToast.classList.add("hidden");
        feedbackDetails.classList.add("hidden");
        if (affiliateCard) affiliateCard.classList.add("hidden");
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
    if (affiliateCard) affiliateCard.classList.add("hidden");
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
            instructionEl.innerText    = "Modo: IMPOSIBLE 🔥\n📅 Estructura: Nombre + Colorway + Año\nEjemplo: Nike Air Max 95 Neon 1995";
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
            instructionEl.innerText    = "Mode: IMPOSSIBLE 🔥\n📅 Structure: Name + Colorway + Year\nExample: Nike Air Max 95 Neon 1995";
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

    const totalPtsEl        = document.getElementById("total-points-val");
    const classicStreakEl   = document.getElementById("streak-classic-normal-val");
    const mpWinsEl          = document.getElementById("mp-wins-val");
    const expNormEl         = document.getElementById("streak-expert-normal-val");
    const expHardEl         = document.getElementById("streak-expert-hard-val");
    const expExpertEl       = document.getElementById("streak-expert-expert-val");

    const mpWins = localStorage.getItem("sneaker_mp_wins") || "0";
    if (mpWinsEl) mpWinsEl.innerText = mpWins;

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

        const totalPts = (profileData && profileData.total_points != null)
            ? profileData.total_points
            : (localStorage.getItem("sneaker_total_points") || "0");

        if (totalPtsEl)      totalPtsEl.innerText      = Number(totalPts).toLocaleString();
        if (classicStreakEl) classicStreakEl.innerText = statsMap["classic_normal"] ?? (localStorage.getItem("sneaker_streak_classic_normal") || "0");
        if (expNormEl)       expNormEl.innerText       = statsMap["expert_normal"]  ?? (localStorage.getItem("sneaker_streak_expert_normal")  || "0");
        if (expHardEl)       expHardEl.innerText       = statsMap["expert_hard"]    ?? (localStorage.getItem("sneaker_streak_expert_hard")    || "0");
        if (expExpertEl)     expExpertEl.innerText     = statsMap["expert_expert"]  ?? (localStorage.getItem("sneaker_streak_expert_expert")  || "0");

    } else {
        // Invitado: cargar desde localStorage
        const totalPts = localStorage.getItem("sneaker_total_points") || "0";
        if (totalPtsEl)      totalPtsEl.innerText      = Number(totalPts).toLocaleString();
        if (classicStreakEl) classicStreakEl.innerText = localStorage.getItem("sneaker_streak_classic_normal") || "0";
        if (expNormEl)       expNormEl.innerText       = localStorage.getItem("sneaker_streak_expert_normal")  || "0";
        if (expHardEl)       expHardEl.innerText       = localStorage.getItem("sneaker_streak_expert_hard")    || "0";
        if (expExpertEl)     expExpertEl.innerText     = localStorage.getItem("sneaker_streak_expert_expert")  || "0";
    }
}

// ====
// LÓGICA DE RESPUESTA
// ====
function checkAnswer(guess) {
    if (isProcessingAnswer) return;
    isProcessingAnswer = true;

    const userAnswer    = guess.toLowerCase().trim();
    const diff          = (gameMode === 'classic') ? 'normal' : difficulties[difficultyIndex];
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

        // Si hay sesión activa, sincronizar puntos acumulados con Supabase
        if (currentUser) {
            savePointsToSupabase(totalPointsSaved);
        }

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

    // Mostrar enlaces de compra para el par revelado (sin spoilers antes de responder)
    if (affiliateCard && currentSneaker) {
        const urls = getAffiliateUrls(currentSneaker);
        if (linkStockx) linkStockx.href = urls.stockx;
        if (linkGoat)   linkGoat.href   = urls.goat;
        if (linkKlekt)  linkKlekt.href  = urls.klekt;
        if (linkEbay)   linkEbay.href   = urls.ebay;
        if (affiliateLabel)   affiliateLabel.innerText   = dictionary[currentLang].affiliateLabel;
        if (affiliateNextBtn) affiliateNextBtn.innerText = dictionary[currentLang].affiliateNextBtn;
        affiliateCard.classList.remove("hidden");
    }

    feedbackTimeout = setTimeout(() => {
        feedbackToast.classList.add("hidden");
        feedbackDetails.classList.add("hidden");
        if (affiliateCard) affiliateCard.classList.add("hidden");
        isProcessingAnswer = false;
        nextQuestion();
    }, 3200);
}

// Pausar temporizador si el jugador interactúa con la tarjeta de afiliados
if (affiliateCard) {
    affiliateCard.addEventListener("mouseenter", () => {
        if (feedbackTimeout) clearTimeout(feedbackTimeout);
    });
    affiliateCard.addEventListener("click", (e) => {
        if (e.target.tagName === 'A' || e.target.closest('a')) {
            if (feedbackTimeout) clearTimeout(feedbackTimeout);
        }
    });
}

// Botón "Siguiente" manual en la tarjeta de afiliados
if (affiliateNextBtn) {
    affiliateNextBtn.addEventListener("click", () => {
        if (feedbackTimeout) clearTimeout(feedbackTimeout);
        feedbackToast.classList.add("hidden");
        feedbackDetails.classList.add("hidden");
        if (affiliateCard) affiliateCard.classList.add("hidden");
        isProcessingAnswer = false;
        nextQuestion();
    });
}

// ==========================================
// CATÁLOGO SNEAKERDEX
// ==========================================
let catalogSneakersList = [];

async function openCatalogModal() {
    await ensureSneakersLoaded();
    catalogSneakersList = [...sneakers];

    // Rellenar marcas si el select solo tiene la opción "Todas las marcas"
    if (catalogBrandFilter && catalogBrandFilter.options.length <= 1) {
        const brands = [...new Set(sneakers.map(s => (s.marca || '').trim()).filter(Boolean))].sort();
        brands.forEach(brand => {
            const opt = document.createElement("option");
            opt.value = brand.toLowerCase();
            opt.textContent = brand;
            catalogBrandFilter.appendChild(opt);
        });
    }

    if (catalogSearch) catalogSearch.value = "";
    if (catalogBrandFilter) catalogBrandFilter.value = "all";

    renderCatalog();
    if (catalogModal) catalogModal.classList.remove("hidden");
}

function renderCatalog() {
    if (!catalogGrid) return;
    catalogGrid.innerHTML = "";

    const query = (catalogSearch ? catalogSearch.value.trim().toLowerCase() : "");
    const selectedBrand = (catalogBrandFilter ? catalogBrandFilter.value.toLowerCase() : "all");

    const filtered = catalogSneakersList.filter(s => {
        const marca = (s.marca || '').toLowerCase();
        const matchBrand = (selectedBrand === "all" || marca === selectedBrand);
        const textToSearch = `${s.nombre || ''} ${s.colorway || ''} ${s.marca || ''} ${s.año || ''}`.toLowerCase();
        const matchQuery = !query || textToSearch.includes(query);
        return matchBrand && matchQuery;
    });

    if (catalogCount) {
        catalogCount.textContent = dictionary[currentLang].showingSneakers(filtered.length, catalogSneakersList.length);
    }

    if (filtered.length === 0) {
        catalogGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px 10px; color: #888;">
                👟 ${currentLang === 'es' ? 'No se encontraron zapatillas con ese filtro.' : 'No sneakers found matching your search.'}
            </div>
        `;
        return;
    }

    filtered.forEach(s => {
        const urls = getAffiliateUrls(s);
        const card = document.createElement("div");
        card.className = "catalog-card";
        card.innerHTML = `
            <div class="catalog-card-header">
                <span class="catalog-badge">${s.marca || 'SNEAKER'}</span>
                <span class="catalog-year">${s.año || ''}</span>
            </div>
            <div class="catalog-img-wrapper">
                <img loading="lazy" src="${s.imagen}" alt="${s.nombre}">
            </div>
            <strong class="catalog-name">${s.nombre}</strong>
            <span class="catalog-colorway">${s.colorway || ''}</span>
            <div class="catalog-shop-btns">
                <a href="${urls.stockx}" target="_blank" rel="noopener noreferrer nofollow sponsored" class="affiliate-btn stockx-btn">StockX</a>
                <a href="${urls.goat}" target="_blank" rel="noopener noreferrer nofollow sponsored" class="affiliate-btn goat-btn">GOAT</a>
                <a href="${urls.klekt}" target="_blank" rel="noopener noreferrer nofollow sponsored" class="affiliate-btn klekt-btn">KLEKT</a>
                <a href="${urls.ebay}" target="_blank" rel="noopener noreferrer nofollow sponsored" class="affiliate-btn ebay-btn">eBay</a>
            </div>
        `;
        catalogGrid.appendChild(card);
    });
}

if (catalogBtn)        catalogBtn.addEventListener("click", openCatalogModal);
if (closeCatalogBtn)   closeCatalogBtn.addEventListener("click", () => catalogModal.classList.add("hidden"));
if (catalogSearch)     catalogSearch.addEventListener("input", renderCatalog);
if (catalogBrandFilter) catalogBrandFilter.addEventListener("change", renderCatalog);

// ====
// DICCIONARIOS DE TRADUCCIÓN
// ====
const dictionary = {
    es: {
        scoreText:          "PUNTOS",
        totalText:          "TOTAL",
        playBtn:            "SOLO PLAY",
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
        infoBody:           `<p style="margin-bottom:15px;text-align:center;font-weight:600;color:#ff6a00;">¡Demuestra tus conocimientos de cultura sneakerhead adivinando el calzado de la imagen!</p><hr style="border:0;height:1px;background:#333;margin-bottom:15px;"><h3 style="color:#fff;font-size:15px;margin-bottom:5px;">🕹️ MODOS DE JUEGO</h3><ul style="margin-left:20px;margin-bottom:15px;padding-left:5px;"><li><strong>Classic:</strong> Elige la respuesta correcta entre 4 opciones con botones.</li><li><strong>Expert:</strong> Pon a prueba tu memoria escribiendo la respuesta exacta.</li><li><strong>⚔️ 1 vs 1 Multijugador:</strong> ¡Duelo en tiempo real estilo Kahoot! Misma zapatilla, 10 segundos por ronda. Cuanto antes aciertes, más puntos. ¡El primero a 3.000 puntos gana!</li></ul><h3 style="color:#fff;font-size:15px;margin-bottom:5px;">🔥 DIFICULTADES (MODO EXPERT)</h3><ul style="margin-left:20px;padding-left:5px;"><li><strong style="color:#2ecc71;">Normal:</strong> Solo el nombre del modelo.</li><li><strong style="color:#f1c40f;">Hard:</strong> Nombre + Colorway.</li><li><strong style="color:#e74c3c;">Imposible:</strong> Nombre + Colorway + Año.</li></ul>`,
        leaderboardTitle:   "🏆 CLASIFICACIONES",
        filterScopeLabel:   "ÁMBITO",
        scopeGlobal:        "🌍 GLOBAL",
        scopeLocal:         "📍 LOCAL",
        filterTypeLabel:    "TIPO",
        typePoints:         "⭐ PUNTOS",
        typeStreak:         "🔥 RACHA",
        filterModeLabel:    "MODO",
        filterDiffLabel:    "DIFICULTAD",
        thPos:              "Pos",
        thPlayer:           "Jugador",
        thCountry:          "País",
        thPoints:           "Puntos",
        thStreak:           "Racha Máx.",
        tabLogin:           "INICIAR SESIÓN",
        tabRegister:        "REGISTRARSE",
        tabDelete:          "ELIMINAR",
        logoutModalBtn:     "SALIR DE LA CUENTA",
        delLoggedBtn:       "🗑️ ELIMINAR MI CUENTA",
        delConfirm:         "¿Estás seguro de que quieres eliminar tu cuenta permanentemente? Se perderán todos tus puntos y posiciones en la clasificación.",
        delSuccess:         "Tu cuenta y tus datos han sido eliminados con éxito.",
        delError:           "Ocurrió un error al intentar eliminar la cuenta. Por favor, inténtalo de nuevo.",
        delWrongCreds:      "Usuario o contraseña incorrectos.",
        catalogBtn:         "👟 CATÁLOGO",
        catalogTitle:       "👟 CATÁLOGO SNEAKERDEX",
        catalogSubtitle:    "Explora todos los modelos de la base de datos y encuéntralos en tus tiendas favoritas.",
        catalogSearchPlaceholder: "Buscar por modelo o colorway...",
        allBrands:          "Todas las marcas",
        showingSneakers:    (count, total) => `Mostrando ${count} de ${total} zapatillas`,
        affiliateLabel:     "🛒 ¿Te mola este par? Cómpralo en:",
        affiliateNextBtn:   "Siguiente ⏩",
        affiliateDisclosure:"⚠️ SneakerGuessr participa en programas de afiliación. Si compras a través de nuestros enlaces, podemos recibir una comisión sin coste adicional para ti.",
        correctToast:       (streak) => `✅ ¡Correcto! (Racha: ${streak})`,
        incorrectToast:     "❌ ¡Fallaste!",
        exactAnswerWas:     "La respuesta exacta era:",
        emptyJsonAlert:     "El archivo zapatillas.json parece estar vacío.",
        criticalErrorAlert: "Error crítico al cargar zapatillas.json. Abre index.html usando 'Live Server'.",
        shareMessage:       (streak, points) => `¡Llevo una racha de ${streak} aciertos y ${points} puntos en SneakerGuessr! ¿Podrás superarme? 👟🔥 Juega gratis aquí: https://sneakerguessr.com`,
        copiedAlert:        "📋 ¡Texto de compartir copiado al portapapeles!",
        multiplayerBtn:     "⚔️ 1 VS 1 MULTIJUGADOR",
        tabMpMatchmaking:   "ONLINE RÁPIDO",
        tabMpFriend:        "SALA CON AMIGO",
        mpSearchingRival:   "Buscando rival en línea...",
        mpRivalFound:       "¡Rival encontrado! Conectando...",
        mpVictory:          "¡VICTORIA!",
        mpDefeat:           "DERROTA",
        mpWonAgainst:       (rival) => `Has derrotado a ${rival}`,
        mpLostAgainst:      (rival) => `${rival} ha ganado la partida`,
        mpRematchBtn:       "JUGAR OTRA VEZ 🔄",
        mpBtnBackMenu:      "VOLVER AL MENÚ 🏠",
        mpLeaveBtn:         "🚪 ABANDONAR PARTIDA",
        mpLeaveConfirm:     "¿Seguro que quieres abandonar la partida? Contará como una retirada.",
        mpDiffImpossible:   "IMPOSIBLE",
        roundText:          (r) => `RONDA ${r}`
    },
    en: {
        scoreText:          "SCORE",
        totalText:          "TOTAL",
        playBtn:            "SOLO PLAY",
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
        infoBody:           `<p style="margin-bottom:15px;text-align:center;font-weight:600;color:#ff6a00;">Prove your sneakerhead culture knowledge by guessing the footwear in the picture!</p><hr style="border:0;height:1px;background:#333;margin-bottom:15px;"><h3 style="color:#fff;font-size:15px;margin-bottom:5px;">🕹️ GAME MODES</h3><ul style="margin-left:20px;margin-bottom:15px;padding-left:5px;"><li><strong>Classic:</strong> Choose the correct answer from 4 options.</li><li><strong>Expert:</strong> Type the exact answer.</li><li><strong>⚔️ 1 vs 1 Multiplayer:</strong> Real-time Kahoot-style battle! Same sneaker, 10 seconds per round. Faster answer = more points. First to 3,000 points wins!</li></ul><h3 style="color:#fff;font-size:15px;margin-bottom:5px;">🔥 DIFFICULTY (EXPERT MODE)</h3><ul style="margin-left:20px;padding-left:5px;"><li><strong style="color:#2ecc71;">Normal:</strong> Model name only.</li><li><strong style="color:#f1c40f;">Hard:</strong> Name + Colorway.</li><li><strong style="color:#e74c3c;">Impossible:</strong> Name + Colorway + Year.</li></ul>`,
        leaderboardTitle:   "🏆 LEADERBOARD",
        filterScopeLabel:   "SCOPE",
        scopeGlobal:        "🌍 GLOBAL",
        scopeLocal:         "📍 LOCAL",
        filterTypeLabel:    "TYPE",
        typePoints:         "⭐ POINTS",
        typeStreak:         "🔥 STREAK",
        filterModeLabel:    "MODE",
        filterDiffLabel:    "DIFFICULTY",
        thPos:              "Rank",
        thPlayer:           "Player",
        thCountry:          "Country",
        thPoints:           "Points",
        thStreak:           "Max Streak",
        tabLogin:           "LOG IN",
        tabRegister:        "SIGN UP",
        tabDelete:          "DELETE",
        logoutModalBtn:     "LOG OUT",
        delLoggedBtn:       "🗑️ DELETE MY ACCOUNT",
        delConfirm:         "Are you sure you want to permanently delete your account? All your points and leaderboard entries will be lost.",
        delSuccess:         "Your account and data have been deleted successfully.",
        delError:           "An error occurred while deleting your account. Please try again.",
        delWrongCreds:      "Incorrect username or password.",
        catalogBtn:         "👟 CATALOG",
        catalogTitle:       "👟 SNEAKERDEX CATALOG",
        catalogSubtitle:    "Browse all sneaker models and find them on your favorite stores.",
        catalogSearchPlaceholder: "Search by model or colorway...",
        allBrands:          "All brands",
        showingSneakers:    (count, total) => `Showing ${count} of ${total} sneakers`,
        affiliateLabel:     "🛒 Like this pair? Buy on:",
        affiliateNextBtn:   "Next ⏩",
        affiliateDisclosure:"⚠️ SneakerGuessr participates in affiliate programs. If you purchase through our links, we may earn a commission at no additional cost to you.",
        correctToast:       (streak) => `✅ Correct! (Streak: ${streak})`,
        incorrectToast:     "❌ Incorrect!",
        exactAnswerWas:     "The exact answer was:",
        emptyJsonAlert:     "The file zapatillas.json appears to be empty.",
        criticalErrorAlert: "Critical error loading zapatillas.json. Open index.html using 'Live Server'.",
        shareMessage:       (streak, points) => `I'm on a streak of ${streak} correct answers and ${points} points on SneakerGuessr! Can you beat me? 👟🔥 Play free here: https://sneakerguessr.com`,
        copiedAlert:        "📋 Sharing text copied to clipboard!",
        multiplayerBtn:     "⚔️ 1 VS 1 MULTIPLAYER",
        tabMpMatchmaking:   "QUICK MATCH",
        tabMpFriend:        "FRIEND ROOM",
        mpSearchingRival:   "Searching for online opponent...",
        mpRivalFound:       "Opponent found! Connecting...",
        mpVictory:          "VICTORY!",
        mpDefeat:           "DEFEAT",
        mpWonAgainst:       (rival) => `You defeated ${rival}`,
        mpLostAgainst:      (rival) => `${rival} won the match`,
        mpRematchBtn:       "PLAY AGAIN 🔄",
        mpBtnBackMenu:      "BACK TO MENU 🏠",
        mpLeaveBtn:         "🚪 LEAVE MATCH",
        mpLeaveConfirm:     "Are you sure you want to leave the match? It will count as a forfeit.",
        mpDiffImpossible:   "IMPOSSIBLE",
        roundText:          (r) => `ROUND ${r}`
    }
};

let currentLang = localStorage.getItem("sneaker_lang") || "es";

// ====
// IDIOMA
// ====
function applyLanguage(lang) {
    const texts = dictionary[lang];

    const el = (id) => document.getElementById(id);

    if (el("play-btn"))            el("play-btn").innerText            = texts.playBtn;
    if (el("game-mode-setup-btn"))  el("game-mode-setup-btn").innerText  = texts.gameModeBtn;
    if (el("submit-guess"))        el("submit-guess").innerText        = texts.submitGuessBtn;
    if (el("back-to-menu-btn"))    el("back-to-menu-btn").innerText    = texts.backToMenuBtn;

    const mpBtnSpan = document.querySelector("#multiplayer-btn span:first-child");
    if (mpBtnSpan) mpBtnSpan.innerText = texts.multiplayerBtn;

    if (el("opt-diff-expert"))            el("opt-diff-expert").innerText            = texts.mpDiffImpossible;
    if (el("filter-diff-impossible-btn"))  el("filter-diff-impossible-btn").innerText  = texts.mpDiffImpossible;
    if (el("tab-mp-matchmaking"))          el("tab-mp-matchmaking").innerText          = texts.tabMpMatchmaking;
    if (el("tab-mp-friend"))               el("tab-mp-friend").innerText               = texts.tabMpFriend;
    if (el("mp-btn-rematch"))              el("mp-btn-rematch").innerText              = texts.mpRematchBtn;
    if (el("mp-btn-back-menu"))            el("mp-btn-back-menu").innerText            = texts.mpBtnBackMenu;
    if (el("mp-leave-btn"))                el("mp-leave-btn").innerText                = texts.mpLeaveBtn;

    if (el("catalog-btn"))            el("catalog-btn").innerText            = texts.catalogBtn;
    if (el("catalog-title"))          el("catalog-title").innerText          = texts.catalogTitle;
    if (el("catalog-subtitle"))       el("catalog-subtitle").innerText       = texts.catalogSubtitle;
    if (el("catalog-search"))         el("catalog-search").placeholder       = texts.catalogSearchPlaceholder;
    if (el("affiliate-label"))        el("affiliate-label").innerText        = texts.affiliateLabel;
    if (el("affiliate-next-btn"))     el("affiliate-next-btn").innerText     = texts.affiliateNextBtn;
    if (el("affiliate-disclosure"))   el("affiliate-disclosure").innerText   = texts.affiliateDisclosure;
    if (catalogBrandFilter && catalogBrandFilter.options[0]) {
        catalogBrandFilter.options[0].text = texts.allBrands;
    }

    if (el("tab-login-btn"))          el("tab-login-btn").innerText          = texts.tabLogin;
    if (el("tab-register-btn"))       el("tab-register-btn").innerText       = texts.tabRegister;
    if (el("tab-delete-btn"))         el("tab-delete-btn").innerText         = texts.tabDelete;
    if (el("btn-modal-logout"))       el("btn-modal-logout").innerText       = texts.logoutModalBtn;
    if (el("btn-modal-delete-logged")) el("btn-modal-delete-logged").innerText = texts.delLoggedBtn;
    if (el("logged-title"))           el("logged-title").innerText           = lang === 'es' ? "👤 MI CUENTA" : "👤 MY ACCOUNT";

    if (el("leaderboard-title"))   el("leaderboard-title").innerText   = texts.leaderboardTitle;
    if (el("filter-scope-label"))  el("filter-scope-label").innerText  = texts.filterScopeLabel;
    if (el("scope-global-btn"))    el("scope-global-btn").innerText    = texts.scopeGlobal;
    if (el("filter-type-label"))   el("filter-type-label").innerText   = texts.filterTypeLabel;
    if (el("type-points-btn"))     el("type-points-btn").innerText     = texts.typePoints;
    if (el("type-streak-btn"))     el("type-streak-btn").innerText     = texts.typeStreak;
    if (el("filter-mode-label"))   el("filter-mode-label").innerText   = texts.filterModeLabel;
    if (el("filter-diff-label"))   el("filter-diff-label").innerText   = texts.filterDiffLabel;

    if (el("th-pos"))     el("th-pos").innerText     = texts.thPos;
    if (el("th-player"))  el("th-player").innerText  = texts.thPlayer;
    if (el("th-country")) el("th-country").innerText = texts.thCountry;
    if (el("th-score")) {
        el("th-score").innerText = selectedFilterType === 'points' ? texts.thPoints : texts.thStreak;
    }

    updateHeaderScore();
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

// ==========================================
// MOTOR MULTIJUGADOR 1 VS 1 (ESTILO KAHOOT)
// ==========================================

function getPlayerDisplayName() {
    if (profileData && profileData.username) return `@${profileData.username}`;
    if (currentUser && currentUser.user_metadata && currentUser.user_metadata.username) {
        return `@${currentUser.user_metadata.username}`;
    }
    return currentLang === 'es' ? "TÚ" : "YOU";
}

function openMpLobby() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');

    if (roomParam) {
        switchMpTab('friend');
        if (mpInputRoomCode) mpInputRoomCode.value = roomParam.toUpperCase();
    } else {
        switchMpTab('matchmaking');
    }

    if (mpRadarBox) mpRadarBox.classList.add("hidden");
    if (mpStartMatchmakingBox) mpStartMatchmakingBox.classList.remove("hidden");
    if (mpLobbyModal) mpLobbyModal.classList.remove("hidden");
}

function closeMpLobby() {
    cleanupMatchmaking();
    if (mpLobbyModal) mpLobbyModal.classList.add("hidden");
}

function switchMpTab(tab) {
    if (tab === 'matchmaking') {
        if (tabMpMatchmaking) tabMpMatchmaking.classList.add("active");
        if (tabMpFriend) tabMpFriend.classList.remove("active");
        if (mpViewMatchmaking) mpViewMatchmaking.classList.remove("hidden");
        if (mpViewFriend) mpViewFriend.classList.add("hidden");
    } else {
        if (tabMpFriend) tabMpFriend.classList.add("active");
        if (tabMpMatchmaking) tabMpMatchmaking.classList.remove("active");
        if (mpViewFriend) mpViewFriend.classList.remove("hidden");
        if (mpViewMatchmaking) mpViewMatchmaking.classList.add("hidden");
    }
}

if (multiplayerBtn) {
    multiplayerBtn.addEventListener("click", openMpLobby);
}
if (closeMpLobbyBtn) {
    closeMpLobbyBtn.addEventListener("click", closeMpLobby);
}
if (tabMpMatchmaking) {
    tabMpMatchmaking.addEventListener("click", () => switchMpTab('matchmaking'));
}
if (tabMpFriend) {
    tabMpFriend.addEventListener("click", () => switchMpTab('friend'));
}

// MATCHMAKING RÁPIDO ONLINE
function cleanupMatchmaking() {
    if (mpQueueInterval) {
        clearInterval(mpQueueInterval);
        mpQueueInterval = null;
    }
    if (mpMatchmakingTimeout) {
        clearTimeout(mpMatchmakingTimeout);
        mpMatchmakingTimeout = null;
    }
    if (mpMatchmakingChannel) {
        try {
            supabaseClient.removeChannel(mpMatchmakingChannel);
        } catch (e) {}
        mpMatchmakingChannel = null;
    }
}

if (btnStartMatchmaking) {
    btnStartMatchmaking.addEventListener("click", async () => {
        await ensureSneakersLoaded();
        if (mpStartMatchmakingBox) mpStartMatchmakingBox.classList.add("hidden");
        if (mpRadarBox) mpRadarBox.classList.remove("hidden");

        mpQueueSeconds = 0;
        if (mpQueueTimer) mpQueueTimer.innerText = "0";
        if (mpRadarStatus) mpRadarStatus.innerText = dictionary[currentLang].mpSearchingRival;

        mpQueueInterval = setInterval(() => {
            mpQueueSeconds++;
            if (mpQueueTimer) mpQueueTimer.innerText = mpQueueSeconds;
        }, 1000);

        const myTicket = 't_' + Math.random().toString(36).substring(2, 8);
        const myName = getPlayerDisplayName();
        let matchFound = false;

        mpMatchmakingChannel = supabaseClient.channel('sneaker_matchmaking_lobby', {
            config: { broadcast: { self: false } }
        });

        mpMatchmakingChannel
            .on('broadcast', { event: 'looking_for_match' }, (payload) => {
                if (matchFound) return;
                const otherTicket = payload.payload ? payload.payload.ticket : null;
                const otherName   = payload.payload ? payload.payload.username : 'Rival';
                if (!otherTicket || otherTicket === myTicket) return;

                if (myTicket > otherTicket) {
                    matchFound = true;
                    const assignedRoom = 'ROOM_' + Math.random().toString(36).substring(2, 7).toUpperCase();
                    mpMatchmakingChannel.send({
                        type: 'broadcast',
                        event: 'match_pair',
                        payload: { targetTicket: otherTicket, room: assignedRoom, hostName: myName, guestName: otherName }
                    });
                    cleanupMatchmaking();
                    if (mpRadarStatus) mpRadarStatus.innerText = dictionary[currentLang].mpRivalFound;
                    setTimeout(() => {
                        closeMpLobby();
                        startMultiplayerMatch(true, otherName, false, assignedRoom);
                    }, 800);
                }
            })
            .on('broadcast', { event: 'match_pair' }, (payload) => {
                if (matchFound) return;
                const data = payload.payload;
                if (data && data.targetTicket === myTicket) {
                    matchFound = true;
                    cleanupMatchmaking();
                    if (mpRadarStatus) mpRadarStatus.innerText = dictionary[currentLang].mpRivalFound;
                    setTimeout(() => {
                        closeMpLobby();
                        startMultiplayerMatch(false, data.hostName, false, data.room);
                    }, 800);
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    mpMatchmakingChannel.send({
                        type: 'broadcast',
                        event: 'looking_for_match',
                        payload: { ticket: myTicket, username: myName }
                    });
                }
            });

        // Si pasan 4.2s sin rival humano online, emparejar con Bot realista
        mpMatchmakingTimeout = setTimeout(() => {
            if (matchFound) return;
            matchFound = true;
            cleanupMatchmaking();
            if (mpRadarStatus) mpRadarStatus.innerText = dictionary[currentLang].mpRivalFound;

            const botList = ["@hypebeast_99", "@kicks_collector", "@sole_master", "@jumpman_alex", "@snkrs_queen", "@air_max_fan"];
            const pickedBot = botList[Math.floor(Math.random() * botList.length)];
            setTimeout(() => {
                closeMpLobby();
                startMultiplayerMatch(true, pickedBot, true, null);
            }, 800);
        }, 4200);
    });
}

if (mpCancelMatchmakingBtn) {
    mpCancelMatchmakingBtn.addEventListener("click", () => {
        cleanupMatchmaking();
        if (mpRadarBox) mpRadarBox.classList.add("hidden");
        if (mpStartMatchmakingBox) mpStartMatchmakingBox.classList.remove("hidden");
    });
}

// SALA CON AMIGO
if (btnCreateRoom) {
    btnCreateRoom.addEventListener("click", async () => {
        await ensureSneakersLoaded();
        const code = Math.random().toString(36).substring(2, 7).toUpperCase();
        mpRoomCode = code;
        if (mpRoomCodeDisplay) mpRoomCodeDisplay.innerText = code;
        if (mpCreatedRoomBox) mpCreatedRoomBox.classList.remove("hidden");

        if (mpChannel) supabaseClient.removeChannel(mpChannel);
        mpChannel = supabaseClient.channel(`sneaker_room_${code}`, {
            config: { broadcast: { self: false } }
        });

        mpChannel
            .on('broadcast', { event: 'guest_joined' }, (payload) => {
                const guestName = (payload.payload && payload.payload.username) ? payload.payload.username : "Amigo";
                closeMpLobby();
                startMultiplayerMatch(true, guestName, false, code);
            })
            .subscribe();
    });
}

if (btnCopyInvite) {
    btnCopyInvite.addEventListener("click", () => {
        if (!mpRoomCode) return;
        const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${mpRoomCode}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(inviteUrl).then(() => {
                const oldText = btnCopyInvite.innerText;
                btnCopyInvite.innerText = "¡ENLACE COPIADO! ✅";
                setTimeout(() => { btnCopyInvite.innerText = oldText; }, 2000);
            }).catch(() => {
                prompt("Copia este enlace de invitación:", inviteUrl);
            });
        } else {
            prompt("Copia este enlace de invitación:", inviteUrl);
        }
    });
}

if (btnJoinRoom) {
    btnJoinRoom.addEventListener("click", async () => {
        await ensureSneakersLoaded();
        const code = (mpInputRoomCode ? mpInputRoomCode.value.trim().toUpperCase() : "");
        if (!code || code.length < 4) {
            alert(currentLang === 'es' ? "Introduce un código de sala válido." : "Enter a valid room code.");
            return;
        }

        btnJoinRoom.disabled = true;
        btnJoinRoom.innerText = currentLang === 'es' ? "Conectando..." : "Connecting...";

        if (mpChannel) supabaseClient.removeChannel(mpChannel);
        mpChannel = supabaseClient.channel(`sneaker_room_${code}`, {
            config: { broadcast: { self: false } }
        });

        mpChannel
            .on('broadcast', { event: 'host_ready' }, (payload) => {
                const hostName = (payload.payload && payload.payload.username) ? payload.payload.username : "Host";
                const sequence = (payload.payload && payload.payload.sequence) ? payload.payload.sequence : null;
                btnJoinRoom.disabled = false;
                btnJoinRoom.innerText = currentLang === 'es' ? "ENTRAR A LA SALA" : "JOIN ROOM";
                closeMpLobby();
                startMultiplayerMatch(false, hostName, false, code, sequence);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    mpChannel.send({
                        type: 'broadcast',
                        event: 'guest_joined',
                        payload: { username: getPlayerDisplayName() }
                    });
                }
            });

        setTimeout(() => {
            if (btnJoinRoom && btnJoinRoom.disabled) {
                btnJoinRoom.disabled = false;
                btnJoinRoom.innerText = currentLang === 'es' ? "ENTRAR A LA SALA" : "JOIN ROOM";
            }
        }, 8000);
    });
}

// BUCLE DE PARTIDA MULTIJUGADOR
async function startMultiplayerMatch(isHost, rivalName, isBot, roomCode, sequence) {
    await ensureSneakersLoaded();

    mpIsHost = isHost;
    mpIsBot = isBot;
    mpRivalUsername = rivalName || "Rival";
    mpRoomCode = roomCode;
    mpLocalPoints = 0;
    mpRivalPoints = 0;
    mpRound = 0;
    mpCurrentIndex = 0;

    if (!isBot && roomCode && isHost) {
        const seqIndices = [];
        for (let i = 0; i < 35; i++) {
            seqIndices.push(Math.floor(Math.random() * sneakers.length));
        }
        mpSneakersList = seqIndices.map(idx => sneakers[idx]);

        if (mpChannel) {
            mpChannel.send({
                type: 'broadcast',
                event: 'host_ready',
                payload: { username: getPlayerDisplayName(), sequence: seqIndices }
            });
        }
    } else if (!isBot && roomCode && !isHost && sequence && Array.isArray(sequence)) {
        mpSneakersList = sequence.map(idx => sneakers[idx] || sneakers[0]);
    } else {
        mpSneakersList = [...sneakers].sort(() => Math.random() - 0.5).slice(0, 35);
    }

    if (!isBot && mpChannel) {
        mpChannel
            .on('broadcast', { event: 'rival_answer' }, (payload) => {
                const data = payload.payload;
                if (data) {
                    handleMpRivalAnswer(data.roundPts, data.isCorrect, data.totalPoints);
                }
            })
            .on('broadcast', { event: 'player_left' }, () => {
                alert(currentLang === 'es'
                    ? `${mpRivalUsername} ha abandonado la partida.`
                    : `${mpRivalUsername} has left the match.`);
                finishMpMatch(true);
            });
    }

    if (mpLocalName)  mpLocalName.innerText  = getPlayerDisplayName();
    if (mpRivalName)  mpRivalName.innerText  = mpRivalUsername;
    if (mpLocalScore) mpLocalScore.innerText = "0";
    if (mpRivalScore) mpRivalScore.innerText = "0";
    if (mpLocalBar)   mpLocalBar.style.width = "0%";
    if (mpRivalBar)   mpRivalBar.style.width = "0%";

    if (menuScreen)        menuScreen.classList.add("hidden");
    if (gameScreen)        gameScreen.classList.add("hidden");
    if (mpResultsModal)    mpResultsModal.classList.add("hidden");
    if (multiplayerScreen) multiplayerScreen.classList.remove("hidden");

    startMpRound();
}

function startMpRound() {
    if (mpTimerInterval) { clearInterval(mpTimerInterval); mpTimerInterval = null; }
    if (mpBotTimeout)    { clearTimeout(mpBotTimeout);    mpBotTimeout = null; }

    if (mpCurrentIndex >= mpSneakersList.length) {
        mpSneakersList = [...sneakers].sort(() => Math.random() - 0.5).slice(0, 35);
        mpCurrentIndex = 0;
    }

    mpRound++;
    if (mpRoundIndicator) mpRoundIndicator.innerText = dictionary[currentLang].roundText(mpRound);
    if (mpRoundFeedback)  mpRoundFeedback.classList.add("hidden");

    if (mpLocalStatus) mpLocalStatus.innerText = currentLang === 'es' ? "Pensando..." : "Thinking...";
    if (mpRivalStatus) mpRivalStatus.innerText = currentLang === 'es' ? "Esperando..." : "Waiting...";

    mpAnswerLocked = false;
    mpRivalAnswered = false;

    const currentSneaker = mpSneakersList[mpCurrentIndex];
    if (mpSneakerImg) mpSneakerImg.src = currentSneaker.imagen;

    // Generar 4 opciones únicas
    const correctText = currentSneaker.nombre.trim();
    const sameBrand = sneakers.filter(s => s.marca.toLowerCase() === currentSneaker.marca.toLowerCase());
    let distractors = [...new Set(sameBrand.map(s => s.nombre.trim()))].filter(n => n !== correctText);
    distractors.sort(() => Math.random() - 0.5);

    if (distractors.length < 3) {
        const otherDistractors = [...new Set(sneakers.map(s => s.nombre.trim()))].filter(n => n !== correctText && !distractors.includes(n));
        otherDistractors.sort(() => Math.random() - 0.5);
        distractors = distractors.concat(otherDistractors.slice(0, 3 - distractors.length));
    }

    const options = [correctText, distractors[0], distractors[1], distractors[2]];
    options.sort(() => Math.random() - 0.5);

    // Botones estilo Kahoot con formas geométricas
    const shapes = ["▲", "◆", "●", "■"];
    if (mpOptionsContainer) {
        mpOptionsContainer.innerHTML = "";
        options.forEach((optText, idx) => {
            const btn = document.createElement("button");
            btn.className = `mp-answer-btn mp-btn-${idx}`;
            btn.innerHTML = `<span class="mp-btn-icon">${shapes[idx]}</span> <span class="mp-btn-text">${optText}</span>`;
            btn.addEventListener("click", () => handleMpLocalAnswer(optText, correctText, btn));
            mpOptionsContainer.appendChild(btn);
        });
    }

    // Cronómetro central de 10 segundos
    mpTimeLeft = 10;
    if (mpTimerVal) mpTimerVal.innerText = "10";
    if (mpTimerCircle) mpTimerCircle.className = "mp-timer-circle";

    mpTimerInterval = setInterval(() => {
        mpTimeLeft -= 0.1;
        if (mpTimerVal) mpTimerVal.innerText = Math.max(0, Math.ceil(mpTimeLeft));

        if (mpTimeLeft <= 3 && mpTimerCircle) {
            mpTimerCircle.classList.add("timer-danger");
        }

        if (mpTimeLeft <= 0) {
            clearInterval(mpTimerInterval);
            mpTimerInterval = null;
            if (!mpAnswerLocked) {
                mpAnswerLocked = true;
                if (mpLocalStatus) mpLocalStatus.innerText = currentLang === 'es' ? "⏰ Tiempo agotado" : "⏰ Time's up";
            }
            endMpRound(correctText);
        }
    }, 100);

    // Simulación de respuesta del Bot
    if (mpIsBot) {
        const botDelay = Math.random() * 3800 + 1800; // entre 1.8s y 5.6s
        const botCorrect = Math.random() < 0.75;      // 75% precisión

        mpBotTimeout = setTimeout(() => {
            const botPts = botCorrect ? Math.max(100, Math.round(1000 * ((10 - (botDelay / 1000)) / 10))) : 0;
            mpRivalPoints += botPts;
            if (mpRivalScore) mpRivalScore.innerText = mpRivalPoints;
            if (mpRivalBar)   mpRivalBar.style.width = Math.min(100, (mpRivalPoints / 3000) * 100) + '%';
            if (mpRivalStatus) mpRivalStatus.innerText = botCorrect ? `✅ +${botPts} pts` : "❌ 0 pts";
            mpRivalAnswered = true;

            if (mpAnswerLocked) {
                setTimeout(() => endMpRound(correctText), 700);
            }
        }, botDelay);
    }
}

function handleMpLocalAnswer(chosenText, correctText, btnElement) {
    if (mpAnswerLocked) return;
    mpAnswerLocked = true;

    const isCorrect = (chosenText === correctText);
    const roundPts = isCorrect ? Math.max(100, Math.round(1000 * (mpTimeLeft / 10))) : 0;

    mpLocalPoints += roundPts;
    if (mpLocalScore) mpLocalScore.innerText = mpLocalPoints;
    if (mpLocalBar)   mpLocalBar.style.width = Math.min(100, (mpLocalPoints / 3000) * 100) + '%';
    if (mpLocalStatus) mpLocalStatus.innerText = isCorrect ? `✅ +${roundPts} pts` : "❌ 0 pts";

    if (btnElement) {
        btnElement.classList.add(isCorrect ? "btn-correct" : "btn-incorrect");
    }

    if (mpChannel && !mpIsBot) {
        mpChannel.send({
            type: 'broadcast',
            event: 'rival_answer',
            payload: { isCorrect, roundPts, totalPoints: mpLocalPoints }
        });
    }

    if (mpRivalAnswered) {
        setTimeout(() => endMpRound(correctText), 700);
    }
}

function handleMpRivalAnswer(roundPts, isCorrect, totalPoints) {
    mpRivalPoints = totalPoints;
    if (mpRivalScore) mpRivalScore.innerText = mpRivalPoints;
    if (mpRivalBar)   mpRivalBar.style.width = Math.min(100, (mpRivalPoints / 3000) * 100) + '%';
    if (mpRivalStatus) mpRivalStatus.innerText = isCorrect ? `✅ +${roundPts} pts` : "❌ 0 pts";
    mpRivalAnswered = true;

    if (mpAnswerLocked) {
        const currentSneaker = mpSneakersList[mpCurrentIndex];
        const correctText = currentSneaker ? currentSneaker.nombre.trim() : "";
        setTimeout(() => endMpRound(correctText), 700);
    }
}

function endMpRound(correctText) {
    if (mpTimerInterval) { clearInterval(mpTimerInterval); mpTimerInterval = null; }
    if (mpBotTimeout)    { clearTimeout(mpBotTimeout);    mpBotTimeout = null; }

    // Revelar la respuesta correcta
    if (mpOptionsContainer) {
        const buttons = mpOptionsContainer.querySelectorAll(".mp-answer-btn");
        buttons.forEach(b => {
            b.style.pointerEvents = "none";
            const textSpan = b.querySelector(".mp-btn-text");
            if (textSpan && textSpan.innerText.trim() === correctText) {
                b.classList.add("btn-correct");
            }
        });
    }

    if (mpRoundFeedback) {
        mpRoundFeedback.innerHTML = `<strong>${correctText}</strong>`;
        mpRoundFeedback.classList.remove("hidden");
    }

    setTimeout(() => {
        if (mpLocalPoints >= 3000 || mpRivalPoints >= 3000) {
            finishMpMatch(false);
        } else {
            mpCurrentIndex++;
            startMpRound();
        }
    }, 2200);
}

function finishMpMatch(forfeitLocalWin) {
    if (mpTimerInterval) { clearInterval(mpTimerInterval); mpTimerInterval = null; }
    if (mpBotTimeout)    { clearTimeout(mpBotTimeout);    mpBotTimeout = null; }

    const localWon = forfeitLocalWin || (mpLocalPoints >= 3000 && mpLocalPoints >= mpRivalPoints) || (mpLocalPoints > mpRivalPoints);

    const finalLocalScoreEl = document.getElementById("mp-final-local-score");
    const finalRivalScoreEl = document.getElementById("mp-final-rival-score");
    const resultsIconEl     = document.getElementById("mp-results-icon");
    const resultsTitleEl    = document.getElementById("mp-results-title");
    const resultsSubEl      = document.getElementById("mp-results-subtitle");
    const rewardBadgeEl     = document.getElementById("mp-reward-badge");

    if (finalLocalScoreEl) finalLocalScoreEl.innerText = Number(mpLocalPoints).toLocaleString();
    if (finalRivalScoreEl) finalRivalScoreEl.innerText = Number(mpRivalPoints).toLocaleString();

    if (localWon) {
        if (resultsIconEl)  resultsIconEl.innerText  = "🏆";
        if (resultsTitleEl) resultsTitleEl.innerText = dictionary[currentLang].mpVictory;
        if (resultsSubEl)   resultsSubEl.innerText   = dictionary[currentLang].mpWonAgainst(mpRivalUsername);
        if (rewardBadgeEl)  rewardBadgeEl.classList.remove("hidden");

        startConfetti();

        // Registrar victoria 1vs1
        let currentMpWins = parseInt(localStorage.getItem("sneaker_mp_wins") || "0");
        currentMpWins++;
        localStorage.setItem("sneaker_mp_wins", currentMpWins);

        // Otorgar +50 puntos de recompensa en perfil
        let totalPts = parseInt(localStorage.getItem("sneaker_total_points") || "0");
        totalPts += 50;
        localStorage.setItem("sneaker_total_points", totalPts);

        if (currentUser) {
            savePointsToSupabase(totalPts).catch(console.error);
        }
        updateHeaderScore();
    } else {
        if (resultsIconEl)  resultsIconEl.innerText  = "💀";
        if (resultsTitleEl) resultsTitleEl.innerText = dictionary[currentLang].mpDefeat;
        if (resultsSubEl)   resultsSubEl.innerText   = dictionary[currentLang].mpLostAgainst(mpRivalUsername);
        if (rewardBadgeEl)  rewardBadgeEl.classList.add("hidden");
        stopConfetti();
    }

    if (mpResultsModal) mpResultsModal.classList.remove("hidden");
}

function cleanupMpMatch() {
    if (mpTimerInterval) { clearInterval(mpTimerInterval); mpTimerInterval = null; }
    if (mpBotTimeout)    { clearTimeout(mpBotTimeout);    mpBotTimeout = null; }
    stopConfetti();

    if (mpChannel) {
        try {
            mpChannel.send({ type: 'broadcast', event: 'player_left', payload: {} });
            supabaseClient.removeChannel(mpChannel);
        } catch (e) {}
        mpChannel = null;
    }

    if (multiplayerScreen) multiplayerScreen.classList.add("hidden");
    if (mpResultsModal)    mpResultsModal.classList.add("hidden");
    if (menuScreen)        menuScreen.classList.remove("hidden");
    updateHeaderScore();
}

if (mpLeaveBtn) {
    mpLeaveBtn.addEventListener("click", () => {
        const confirmed = confirm(dictionary[currentLang].mpLeaveConfirm);
        if (confirmed) cleanupMpMatch();
    });
}

if (mpBtnRematch) {
    mpBtnRematch.addEventListener("click", () => {
        stopConfetti();
        if (mpResultsModal) mpResultsModal.classList.add("hidden");
        startMultiplayerMatch(true, mpRivalUsername, mpIsBot, mpRoomCode);
    });
}

if (mpBtnBackMenu) {
    mpBtnBackMenu.addEventListener("click", cleanupMpMatch);
}

// ANIMACIÓN DE CONFETI EN CANVAS
function startConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.parentElement.clientWidth || 440;
    canvas.height = canvas.parentElement.clientHeight || 400;

    const pieces = [];
    const colors = ["#ff6a00", "#ee0979", "#2ecc71", "#f1c40f", "#3498db", "#9b59b6"];
    for (let i = 0; i < 75; i++) {
        pieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 8 + 4,
            speedY: Math.random() * 3 + 2,
            speedX: Math.random() * 2 - 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 4 - 2
        });
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;
            if (p.y > canvas.height) {
                p.y = -10;
                p.x = Math.random() * canvas.width;
            }
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        });
        mpConfettiAnimationId = requestAnimationFrame(render);
    }
    stopConfetti();
    render();
}

function stopConfetti() {
    if (mpConfettiAnimationId) {
        cancelAnimationFrame(mpConfettiAnimationId);
        mpConfettiAnimationId = null;
    }
    const canvas = document.getElementById("confetti-canvas");
    if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// ====
// INICIALIZACIÓN (esperar a que el DOM esté listo)
// ====
document.addEventListener("DOMContentLoaded", () => {
    applyLanguage(currentLang);
    initAuth(); // Arrancar el sistema de autenticación Supabase

    // Detección automática de invitación por enlace de amigo (?room=CODE)
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
        setTimeout(() => {
            openMpLobby();
        }, 500);
    }

    // Mostrar tutorial automáticamente la primera vez que se abre la web
    const hasSeenTutorial = localStorage.getItem("sneaker_tutorial_seen");
    if (!hasSeenTutorial) {
        setTimeout(() => {
            if (infoModal && !roomParam) {
                infoModal.classList.remove("hidden");
                localStorage.setItem("sneaker_tutorial_seen", "true");
            }
        }, 600);
    }
});