// ELEMENTOS DEL HTML
const playBtn = document.getElementById("play-btn");
const gameModeSetupBtn = document.getElementById("game-mode-setup-btn"); 
const statsBtn = document.getElementById("stats-btn");

// Elementos del modal de información
const infoBtn = document.getElementById("info-btn");
const infoModal = document.getElementById("info-modal");
const closeInfoBtn = document.getElementById("close-info-btn");

// Modales y Cierres
const statsModal = document.getElementById("stats-modal");
const closeStatsBtn = document.getElementById("close-stats-btn");
const gameModeModal = document.getElementById("game-mode-modal");
const closeGameModeBtn = document.getElementById("close-game-mode-btn");

// Elementos de Clasificación (Leaderboard) y Autenticación
const leaderboardBtn = document.getElementById("leaderboard-btn");
const leaderboardModal = document.getElementById("leaderboard-modal");
const closeLeaderboardBtn = document.getElementById("close-leaderboard-btn");
const leaderboardBody = document.getElementById("leaderboard-body");
const leaderboardTabs = document.querySelectorAll(".leaderboard-tabs .tab-btn");
const authBtn = document.getElementById("auth-btn");

// ELEMENTOS DEL MODAL DE AUTENTICACIÓN
const authModal = document.getElementById("auth-modal");
const closeAuthBtn = document.getElementById("close-auth-btn");
const tabLoginBtn = document.getElementById("tab-login-btn");
const tabRegisterBtn = document.getElementById("tab-register-btn");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

// Botones internos del Panel de Ajustes
const optModeClassic = document.getElementById("opt-mode-classic");
const optModeExpert = document.getElementById("opt-mode-expert");
const optDiffNormal = document.getElementById("opt-diff-normal");
const optDiffHard = document.getElementById("opt-diff-hard");
const optDiffExpert = document.getElementById("opt-diff-expert");

// Pantallas de Juego y Componentes
const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");
const sneakerImg = document.getElementById("sneaker-img");
const optionsContainer = document.getElementById("options-container");
const expertContainer = document.getElementById("expert-mode-container");
const sneakerInput = document.getElementById("sneaker-input");
const submitBtn = document.getElementById("submit-guess");
const scoreVal = document.getElementById("score-val");

// Feedback Visual y Navegación
const backToMenuBtn = document.getElementById("back-to-menu-btn");
const feedbackToast = document.getElementById("feedback-toast");
const feedbackDetails = document.getElementById("feedback-details");

// VARIABLES DE ESTADO
let sneakers = [];      
let gamePool = [];      
let currentSneaker = {};
let score = 0;
let gameMode = 'classic'; 
let currentStreak = 0;
const difficulties = ['normal', 'hard', 'expert'];
let difficultyIndex = 0; 

// Mecanismos de control de tiempos
let feedbackTimeout = null;
let isProcessingAnswer = false; 

// ESTADO DE USUARIO ACTUAL
let currentUser = JSON.parse(localStorage.getItem("sneaker_current_user")) || null;

// EVENTOS DE CONTROL DEL MENÚ
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

// CONTROL MODAL CLASIFICACIONES
leaderboardBtn.addEventListener("click", () => {
    renderLeaderboard("daily");
    leaderboardModal.classList.remove("hidden");
});
closeLeaderboardBtn.addEventListener("click", () => leaderboardModal.classList.add("hidden"));

leaderboardTabs.forEach(tab => {
    tab.addEventListener("click", (e) => {
        leaderboardTabs.forEach(t => t.classList.remove("active"));
        e.target.classList.add("active");
        const view = e.target.getAttribute("data-view");
        renderLeaderboard(view);
    });
});

// CONTROL LOGUIN / LOGOUT DESDE EL MENÚ
authBtn.addEventListener("click", () => {
    if (currentUser) {
        if(confirm(currentLang === 'es' ? "¿Quieres cerrar sesión?" : "Do you want to log out?")) {
            currentUser = null;
            localStorage.removeItem("sneaker_current_user");
            updateAuthButton();
        }
    } else {
        authModal.classList.remove("hidden");
    }
});
closeAuthBtn.addEventListener("click", () => authModal.classList.add("hidden"));

// INTERCAMBIO DE PESTAÑAS (LOGIN vs REGISTRO)
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

// ENVIAR FORMULARIO DE REGISTRO
registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const userVal = document.getElementById("reg-username").value.trim();
    const countryVal = document.getElementById("reg-country").value.trim().toUpperCase();
    const passVal = document.getElementById("reg-password").value;

    if(passVal.length < 4) {
        alert(currentLang === 'es' ? "La contraseña debe tener mínimo 4 caracteres." : "Password must be at least 4 characters long.");
        return;
    }

    let localUsers = JSON.parse(localStorage.getItem("sneaker_sim_users")) || [];
    if(localUsers.some(u => u.username.toLowerCase() === userVal.toLowerCase())) {
        alert(currentLang === 'es' ? "Este nombre de usuario ya existe." : "Username already exists.");
        return;
    }

    const newUser = {
        username: userVal,
        country: countryVal,
        password: passVal,
        maxScore: 0,
        maxStreak: 0
    };

    localUsers.push(newUser);
    localStorage.setItem("sneaker_sim_users", JSON.stringify(localUsers));
    
    currentUser = newUser;
    localStorage.setItem("sneaker_current_user", JSON.stringify(currentUser));
    
    registerForm.reset();
    authModal.classList.add("hidden");
    updateAuthButton();
    alert(currentLang === 'es' ? `¡Cuenta creada! Bienvenido, ${userVal}` : `Account created! Welcome, ${userVal}`);
});

// ENVIAR FORMULARIO DE LOGIN
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const userVal = document.getElementById("login-username").value.trim();
    const passVal = document.getElementById("login-password").value;

    let localUsers = JSON.parse(localStorage.getItem("sneaker_sim_users")) || [];
    const foundUser = localUsers.find(u => u.username.toLowerCase() === userVal.toLowerCase() && u.password === passVal);

    if(!foundUser) {
        alert(currentLang === 'es' ? "Usuario o contraseña incorrectos." : "Incorrect username or password.");
        return;
    }

    currentUser = foundUser;
    localStorage.setItem("sneaker_current_user", JSON.stringify(currentUser));
    
    loginForm.reset();
    authModal.classList.add("hidden");
    updateAuthButton();
});

function updateAuthButton() {
    if (currentUser) {
        authBtn.innerText = `👤 ${dictionary[currentLang].helloText}, ${currentUser.username} (${dictionary[currentLang].logoutText})`;
        authBtn.style.background = "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)";
    } else {
        authBtn.innerText = dictionary[currentLang].authBtn;
        authBtn.style.background = "linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)";
    }
}

// Ventanas y cierres globales al pulsar fuera de ellas
window.addEventListener("click", (e) => {
    if (e.target === statsModal) statsModal.classList.add("hidden");
    if (e.target === gameModeModal) gameModeModal.classList.add("hidden");
    if (e.target === infoModal) infoModal.classList.add("hidden"); 
    if (e.target === leaderboardModal) leaderboardModal.classList.add("hidden"); 
    if (e.target === authModal) authModal.classList.add("hidden"); 
});

backToMenuBtn.addEventListener("click", () => {
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
    isProcessingAnswer = false;
    feedbackToast.classList.add("hidden");
    feedbackDetails.classList.add("hidden");
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
});

// INTERRUPTORES DE AJUSTES
optModeClassic.addEventListener("click", () => {
    if (gameMode !== 'classic') {
        gameMode = 'classic';
        currentStreak = 0;
        updateModalUI();
        if (!gameScreen.classList.contains("hidden")) {
            prepareGamePool();
            nextQuestion();
        }
    }
});

optModeExpert.addEventListener("click", () => {
    if (gameMode !== 'expert') {
        gameMode = 'expert';
        currentStreak = 0;
        updateModalUI();
        if (!gameScreen.classList.contains("hidden")) {
            prepareGamePool();
            nextQuestion();
        }
    }
});

optDiffNormal.addEventListener("click", () => {
    if (difficultyIndex !== 0) {
        difficultyIndex = 0;
        currentStreak = 0;
        updateModalUI();
        if (!gameScreen.classList.contains("hidden")) {
            prepareGamePool();
            nextQuestion();
        }
    }
});

optDiffHard.addEventListener("click", () => {
    if (difficultyIndex !== 1) {
        difficultyIndex = 1;
        currentStreak = 0;
        updateModalUI();
        if (!gameScreen.classList.contains("hidden")) {
            prepareGamePool();
            nextQuestion();
        }
    }
});

optDiffExpert.addEventListener("click", () => {
    if (difficultyIndex !== 2) {
        difficultyIndex = 2;
        currentStreak = 0;
        updateModalUI();
        if (!gameScreen.classList.contains("hidden")) {
            prepareGamePool();
            nextQuestion();
        }
    }
});

function updateModalUI() {
    optModeClassic.classList.remove("active");
    optModeExpert.classList.remove("active");
    optDiffNormal.classList.remove("active");
    optDiffHard.classList.remove("active");
    optDiffExpert.classList.remove("active");

    if (gameMode === 'classic') optModeClassic.classList.add("active");
    else optModeExpert.classList.add("active");

    if (difficultyIndex === 0) optDiffNormal.classList.add("active");
    else if (difficultyIndex === 1) optDiffHard.classList.add("active");
    else if (difficultyIndex === 2) optDiffExpert.classList.add("active");
}

// MOTOR DE RENDERIZADO 100% REAL PARA CLASIFICACIONES
function renderLeaderboard(type) {
    leaderboardBody.innerHTML = "";
    
    // 1. Cargar usuarios reales registrados en el localStorage de la app
    let localUsers = JSON.parse(localStorage.getItem("sneaker_sim_users")) || [];
    
    // Formatear y preparar los campos de ordenación unificando récords
    let usersToShow = localUsers.map(u => {
        let isMe = currentUser && u.username === currentUser.username;
        let totalPointsSaved = isMe ? parseInt(localStorage.getItem("sneaker_total_points") || "0") : (u.maxScore || 0);
        
        let maxStreakCalculated = u.maxStreak || 0;
        if (isMe) {
            const modes = ['classic_normal', 'classic_hard', 'classic_expert', 'expert_normal', 'expert_hard', 'expert_expert'];
            modes.forEach(m => {
                let s = parseInt(localStorage.getItem(`sneaker_streak_${m}`) || "0");
                if (s > maxStreakCalculated) maxStreakCalculated = s;
            });
        }

        return {
            username: u.username,
            country: u.country || "??",
            currentStreak: isMe ? currentStreak : 0,
            maxStreak: maxStreakCalculated,
            totalPoints: totalPointsSaved,
            isCurrent: isMe
        };
    });

    // 2. Ejecutar algoritmo de ordenamiento según la pestaña pulsada
    if (type === 'daily') {
        usersToShow.sort((a, b) => b.currentStreak - a.currentStreak);
    } else if (type === 'streaks') {
        usersToShow.sort((a, b) => b.maxStreak - a.maxStreak);
    } else if (type === 'scores') {
        usersToShow.sort((a, b) => b.totalPoints - a.totalPoints);
    }

    // 3. Imprimir filas de forma estricta hasta cubrir el Top 10
    for (let i = 0; i < 10; i++) {
        const row = document.createElement("tr");
        const user = usersToShow[i];
        let positionMarker = `${i + 1}º`;
        
        if (user) {
            let displayName = user.username;
            let displayLocal = "-";
            let displayGlobal = "-";

            if (user.isCurrent) {
                row.style.background = "rgba(255, 106, 0, 0.1)";
                row.style.borderLeft = "3px solid #ff6a00";
                displayName = `⭐ ${user.username} (${currentLang === 'es' ? 'Tú' : 'You'})`;
            }

            if (type === 'daily') {
                displayLocal = `${user.currentStreak} (${user.country})`;
                displayGlobal = `${user.currentStreak}`;
            } else if (type === 'streaks') {
                displayLocal = `${user.maxStreak} (${user.country})`;
                displayGlobal = `${user.maxStreak}`;
            } else if (type === 'scores') {
                displayLocal = `${user.totalPoints} (${user.country})`;
                displayGlobal = `${user.totalPoints}`;
            }

            row.innerHTML = `
                <td><strong>${positionMarker}</strong></td>
                <td>${displayName}</td>
                <td>${displayLocal}</td>
                <td><strong>${displayGlobal}</strong></td>
            `;
        } else {
            // Relleno limpio e inerte si no hay suficientes perfiles reales guardados
            row.innerHTML = `
                <td><span style="color: #444;">${positionMarker}</span></td>
                <td><span style="color: #444;">-</span></td>
                <td><span style="color: #444;">-</span></td>
                <td><span style="color: #444;">-</span></td>
            `;
        }
        leaderboardBody.appendChild(row);
    }
}

// LÓGICA DEL MOTOR DE JUEGO
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
    const nombreBase = sneaker.nombre.trim();
    const colorwayBase = (sneaker.colorway || "").trim();
    const elAnioReal = (sneaker.año || sneaker.anio || sneaker.lanzamiento || "").toString().trim();

    if (diff === 'normal') return nombreBase;
    if (diff === 'hard') return `${nombreBase} ${colorwayBase}`.trim();
    if (diff === 'expert') return `${nombreBase} ${colorwayBase} ${elAnioReal}`.trim();
    return nombreBase;
}

function nextQuestion() {
    if (gamePool.length === 0) {
        prepareGamePool();
    }

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
        if (diff === 'normal') {
            instructionEl.innerText = "Modo: NORMAL\n📝 Escribe solo el nombre del modelo\nEjemplo: Nike Air Max 95";
            sneakerInput.placeholder = "Nombre del modelo...";
        } else if (diff === 'hard') {
            instructionEl.innerText = "Modo: DIFÍCIL\n🎨 Estructura: Nombre + Colorway\nEjemplo: Nike Air Max 95 Neon";
            sneakerInput.placeholder = "Nombre + Colorway...";
        } else if (diff === 'expert') {
            instructionEl.innerText = "Modo: EXPERTO 🔥\n📅 Estructura: Nombre + Colorway + Año\nEjemplo: Nike Air Max 95 Neon 1995";
            sneakerInput.placeholder = "Nombre + Colorway + Año...";
        }
    } else {
        if (diff === 'normal') {
            instructionEl.innerText = "Mode: NORMAL\n📝 Type only the model name\nExample: Nike Air Max 95";
            sneakerInput.placeholder = "Model name...";
        } else if (diff === 'hard') {
            instructionEl.innerText = "Mode: HARD\n🎨 Structure: Name + Colorway\nExample: Nike Air Max 95 Neon";
            sneakerInput.placeholder = "Name + Colorway...";
        } else if (diff === 'expert') {
            instructionEl.innerText = "Mode: EXPERT 🔥\n📅 Structure: Name + Colorway + Year\nExample: Nike Air Max 95 Neon 1995";
            sneakerInput.placeholder = "Name + Colorway + Year...";
        }
    }
}

function generateButtons() {
    optionsContainer.innerHTML = ""; 
    const diff = difficulties[difficultyIndex];
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
        
        const needed = 3 - selectedDistractors.length;
        selectedDistractors = selectedDistractors.concat(otherDistractors.slice(0, needed));
    }
    
    const selectedOptions = [correctText, ...selectedDistractors];
    selectedOptions.sort(() => Math.random() - 0.5);

    selectedOptions.forEach(text => {
        const btn = document.createElement("button");
        btn.classList.add("answer-btn");
        btn.innerText = text;
        btn.onclick = () => checkAnswer(text);
        optionsContainer.appendChild(btn);
    });
}

sneakerInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") checkAnswer(sneakerInput.value);
});

submitBtn.addEventListener("click", () => {
    checkAnswer(sneakerInput.value);
});

function openStatsModal() {
    statsModal.classList.remove("hidden");
    
    const recordLabels = document.querySelectorAll("#stats-modal .stat-box:not(.full-width) .stat-label");
    if (recordLabels.length >= 6) {
        recordLabels[0].innerText = "Classic (Normal)";
    }

    document.getElementById("total-points-val").innerText = localStorage.getItem("sneaker_total_points") || "0";
    
    document.getElementById("streak-classic-normal-val").innerText = localStorage.getItem("sneaker_streak_classic_normal") || "0";
    document.getElementById("streak-classic-hard-val").innerText = localStorage.getItem("sneaker_streak_classic_hard") || "0";
    document.getElementById("streak-classic-expert-val").innerText = localStorage.getItem("sneaker_streak_classic_expert") || "0";
    
    document.getElementById("streak-expert-normal-val").innerText = localStorage.getItem("sneaker_streak_expert_normal") || "0";
    document.getElementById("streak-expert-hard-val").innerText = localStorage.getItem("sneaker_streak_expert_hard") || "0";
    document.getElementById("streak-expert-expert-val").innerText = localStorage.getItem("sneaker_streak_expert_expert") || "0";
}

function checkAnswer(guess) {
    if (isProcessingAnswer) return;
    isProcessingAnswer = true;

    const userAnswer = guess.toLowerCase().trim();
    const diff = difficulties[difficultyIndex];
    let isCorrect = false;

    let validAnswers = [];
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
                const elAnioReal = (currentSneaker.año || currentSneaker.anio || currentSneaker.lanzamiento || "").toString().toLowerCase().trim();
                validAnswers.push(`${sinClean} ${colorwayBase} ${elAnioReal}`.trim());
            }
        });
    }

    if (gameMode === 'classic') {
        isCorrect = (userAnswer === correctAnswer);
    } else {
        isCorrect = validAnswers.includes(userAnswer);
        
        if (!isCorrect) {
            const targetWords = /\b(high|low|mid)\b/gi;
            const cleanUser = userAnswer.replace(targetWords, '').replace(/\s+/g, ' ').trim();
            const cleanValids = validAnswers.map(ans => 
                ans.replace(targetWords, '').replace(/\s+/g, ' ').trim()
            );
            isCorrect = cleanValids.includes(cleanUser);
        }
    }

    const respuestaRevelada = formatSneakerText(currentSneaker, diff);

    if (isCorrect) {
        score += 10;
        currentStreak++;
        
        let totalPointsSaved = parseInt(localStorage.getItem("sneaker_total_points") || "0");
        totalPointsSaved += 10;
        localStorage.setItem("sneaker_total_points", totalPointsSaved);

        let keyModo = `${gameMode}_${diff}`;
        let recordRachaGuardada = parseInt(localStorage.getItem(`sneaker_streak_${keyModo}`) || "0");
        if (currentStreak > recordRachaGuardada) {
            localStorage.setItem(`sneaker_streak_${keyModo}`, currentStreak);
            
            if (currentUser) {
                let localUsers = JSON.parse(localStorage.getItem("sneaker_sim_users")) || [];
                let uIndex = localUsers.findIndex(u => u.username === currentUser.username);
                if (uIndex !== -1) {
                    localUsers[uIndex].maxStreak = Math.max(localUsers[uIndex].maxStreak, currentStreak);
                    localUsers[uIndex].maxScore = totalPointsSaved;
                    localStorage.setItem("sneaker_sim_users", JSON.stringify(localUsers));
                }
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

// TRADUCCIONES E IDIOMAS (MODIFICACIÓN: Textos ajustados a "Iniciar sesión")
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
        infoBody: `<p style="margin-bottom: 15px; text-align: center; font-weight: 600; color: #ff6a00;">¡Demuestra tus conocimientos de cultura sneakerhead adivinando el calzado de la imagen!</p><hr style="border: 0; height: 1px; background: #333; margin-bottom: 15px;"><h3 style="color: #fff; font-size: 15px; margin-bottom: 5px;">🕹️ MODOS DE JUEGO</h3><ul style="margin-left: 20px; margin-bottom: 15px; padding-left: 5px;"><li><strong>Classic:</strong> Elige la respuesta correcta entre 4 opciones con botones.</li><li><strong>Expert:</strong> Pon a prueba tu memoria escribiendo la respuesta exacta.</li></ul><h3 style="color: #fff; font-size: 15px; margin-bottom: 5px;">🔥 DIFICULTADES</h3><ul style="margin-left: 20px; padding-left: 5px;"><li><strong style="color: #2ecc71;">Normal:</strong> Solo el <strong>Nombre del modelo</strong> (Ej: <em>Nike Air Jordan 1</em>).</li><li><strong style="color: #f1c40f;">Hard:</strong> Requiere <strong>Nombre + Colorway</strong> (Ej: <em>Nike Air Jordan 1 Chicago</em>).</li><li><strong style="color: #e74c3c;">Expert:</strong> Requiere <strong>Nombre + Colorway + Año</strong> (Ej: <em>Nike Air Jordan 1 Chicago 1985</em>).</li></ul>`,
        
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
        infoBody: `<p style="margin-bottom: 15px; text-align: center; font-weight: 600; color: #ff6a00;">Prove your sneakerhead culture knowledge by guessing the footwear in the picture!</p><hr style="border: 0; height: 1px; background: #333; margin-bottom: 15px;"><h3 style="color: #fff; font-size: 15px; margin-bottom: 5px;">🕹️ GAME MODES</h3><ul style="margin-left: 20px; margin-bottom: 15px; padding-left: 5px;"><li><strong>Classic:</strong> Choose the correct answer from 4 options using buttons.</li><li><strong>Expert:</strong> Test your memory by typing the exact answer.</li></ul><h3 style="color: #fff; font-size: 15px; margin-bottom: 5px;">🔥 DIFFICULTY LEVELS</h3><ul style="margin-left: 20px; padding-left: 5px;"><li><strong style="color: #2ecc71;">Normal:</strong> Only the <strong>Model name</strong> (e.g., <em>Nike Air Jordan 1</em>).</li><li><strong style="color: #f1c40f;">Hard:</strong> Requires <strong>Name + Colorway</strong> (e.g., <em>Nike Air Jordan 1 Chicago</em>).</li><li><strong style="color: #e74c3c;">Expert:</strong> Requires <strong>Name + Colorway + Year</strong> (e.g., <em>Nike Air Jordan 1 Chicago 1985</em>).</li></ul>`,
        
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
    
    if (document.getElementById("score-text")) document.getElementById("score-text").innerText = texts.scoreText;
    if (document.getElementById("play-btn")) document.getElementById("play-btn").innerText = texts.playBtn;
    if (document.getElementById("game-mode-setup-btn")) document.getElementById("game-mode-setup-btn").innerText = texts.gameModeBtn;
    if (document.getElementById("submit-guess")) document.getElementById("submit-guess").innerText = texts.submitGuessBtn;
    if (document.getElementById("back-to-menu-btn")) document.getElementById("back-to-menu-btn").innerText = texts.backToMenuBtn;
    
    if (document.getElementById("tab-login-btn")) document.getElementById("tab-login-btn").innerText = lang === 'es' ? "INICIAR SESIÓN" : "LOG IN";
    if (document.getElementById("tab-register-btn")) document.getElementById("tab-register-btn").innerText = lang === 'es' ? "REGISTRARSE" : "SIGN UP";
    if (document.getElementById("lbl-login-user")) document.getElementById("lbl-login-user").innerText = lang === 'es' ? "Usuario" : "Username";
    if (document.getElementById("lbl-login-pass")) document.getElementById("lbl-login-pass").innerText = lang === 'es' ? "Contraseña" : "Password";
    if (document.getElementById("lbl-reg-user")) document.getElementById("lbl-reg-user").innerText = lang === 'es' ? "Usuario" : "Username";
    if (document.getElementById("lbl-reg-country")) document.getElementById("lbl-reg-country").innerText = lang === 'es' ? "País (Código ej: ES, US)" : "Country (Code ex: US, UK)";
    if (document.getElementById("lbl-reg-pass")) document.getElementById("lbl-reg-pass").innerText = lang === 'es' ? "Contraseña" : "Password";
    if (document.getElementById("btn-submit-login")) document.getElementById("btn-submit-login").innerText = lang === 'es' ? "ENTRAR" : "SIGN IN";
    if (document.getElementById("btn-submit-reg")) document.getElementById("btn-submit-reg").innerText = lang === 'es' ? "CREAR CUENTA" : "CREATE ACCOUNT";

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
    
    const infoBody = document.querySelector("#info-modal .modal-content > div");
    if (infoBody) infoBody.innerHTML = texts.infoBody;
    
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
    const currentScore = score || 0; 
    const currentStreakVal = currentStreak || 0;
    const textToShare = dictionary[currentLang].shareMessage(currentStreakVal, currentScore);

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'SneakerGuessr',
                text: textToShare,
                url: 'https://sneakerguessr.com'
            });
        } catch (err) {
            console.log("Compartir cancelado o con errores", err);
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

document.addEventListener("DOMContentLoaded", () => {
    applyLanguage(currentLang);
});