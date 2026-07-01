// ELEMENTOS DEL HTML
const playBtn = document.getElementById("play-btn");
const gameModeSetupBtn = document.getElementById("game-mode-setup-btn"); // Botón principal unificado
const statsBtn = document.getElementById("stats-btn");

// NUEVO: Elementos del modal de información
const infoBtn = document.getElementById("info-btn");
const infoModal = document.getElementById("info-modal");
const closeInfoBtn = document.getElementById("close-info-btn");

// Modales y Cierres
const statsModal = document.getElementById("stats-modal");
const closeStatsBtn = document.getElementById("close-stats-btn");
const gameModeModal = document.getElementById("game-mode-modal");
const closeGameModeBtn = document.getElementById("close-game-mode-btn");

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

// EVENTOS DE CONTROL DEL MENÚ
playBtn.addEventListener("click", () => {
    menuScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    startGame();
});

// Abrir Panel de configuración y actualizar botones activos
gameModeSetupBtn.addEventListener("click", () => {
    updateModalUI();
    gameModeModal.classList.remove("hidden");
});

closeGameModeBtn.addEventListener("click", () => {
    gameModeModal.classList.add("hidden");
});

statsBtn.addEventListener("click", openStatsModal);
closeStatsBtn.addEventListener("click", () => statsModal.classList.add("hidden"));

// NUEVO: Eventos para controlar la apertura y cierre del modal de información
infoBtn.addEventListener("click", () => infoModal.classList.remove("hidden"));
closeInfoBtn.addEventListener("click", () => infoModal.classList.add("hidden"));

// Cerrar modales haciendo click fuera de la caja
window.addEventListener("click", (e) => {
    if (e.target === statsModal) statsModal.classList.add("hidden");
    if (e.target === gameModeModal) gameModeModal.classList.add("hidden");
    if (e.target === infoModal) infoModal.classList.add("hidden"); // NUEVO
});

backToMenuBtn.addEventListener("click", () => {
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
    isProcessingAnswer = false;
    feedbackToast.classList.add("hidden");
    feedbackDetails.classList.add("hidden");
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
});

// INTERRUPTORES DENTRO DEL MODAL (LÓGICA SELECTIVA)
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

// Función para pintar visualmente qué botones están encendidos en el panel
function updateModalUI() {
    // Quitar estados activos antiguos
    optModeClassic.classList.remove("active");
    optModeExpert.classList.remove("active");
    optDiffNormal.classList.remove("active");
    optDiffHard.classList.remove("active");
    optDiffExpert.classList.remove("active");

    // Iluminar modo actual
    if (gameMode === 'classic') optModeClassic.classList.add("active");
    else optModeExpert.classList.add("active");

    // Iluminar dificultad actual con su respectivo color
    if (difficultyIndex === 0) optDiffNormal.classList.add("active");
    else if (difficultyIndex === 1) optDiffHard.classList.add("active");
    else if (difficultyIndex === 2) optDiffExpert.classList.add("active");
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
    
    // MEJORA: Eliminamos la zapatilla seleccionada del pool de juego activo para que no se repita
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
    
    // 1. Filtramos la base de datos para quedarnos SOLO con zapatillas de la MISMA marca
    const sameBrandSneakers = sneakers.filter(s => s.marca.toLowerCase() === currentSneaker.marca.toLowerCase());
    
    // Convertimos a textos formateados según dificultad y eliminamos duplicados (gracias al Set)
    let brandDistractors = [...new Set(sameBrandSneakers.map(s => formatSneakerText(s, diff)))]
                            .filter(text => text !== correctText);
    
    // Mezclamos los distractores de la misma marca
    brandDistractors.sort(() => Math.random() - 0.5);
    
    let selectedDistractors = [];
    
    // 2. SISTEMA DE SEGURIDAD: Comprobamos si hay suficientes zapatillas de esa marca para rellenar
    if (brandDistractors.length >= 3) {
        // Si tenemos 3 o más de la misma marca, agarramos 3 y listo
        selectedDistractors = brandDistractors.slice(0, 3);
    } else {
        // Si no hay suficientes (ej: la foto es una Puma y solo tienes dos Puma en todo el JSON)
        // Agarramos las pocas que haya de la misma marca...
        selectedDistractors = [...brandDistractors];
        
        // ...y el resto lo rellenamos con zapatillas de OTRAS marcas para que el juego no se rompa
        const otherBrandSneakers = sneakers.filter(s => s.marca.toLowerCase() !== currentSneaker.marca.toLowerCase());
        let otherDistractors = [...new Set(otherBrandSneakers.map(s => formatSneakerText(s, diff)))];
        otherDistractors.sort(() => Math.random() - 0.5);
        
        const needed = 3 - selectedDistractors.length;
        selectedDistractors = selectedDistractors.concat(otherDistractors.slice(0, needed));
    }
    
    // 3. Juntamos la opción correcta con los 3 distractores definitivos y los mezclamos en los botones
    const selectedOptions = [correctText, ...selectedDistractors];
    selectedOptions.sort(() => Math.random() - 0.5);

    // Renderizamos los botones en el HTML
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
    
    // Actualizar las etiquetas dinámicas de récords al abrir
    const recordLabels = document.querySelectorAll("#stats-modal .stat-box:not(.full-width) .stat-label");
    if (recordLabels.length >= 6) {
        recordLabels[0].innerText = gameMode === 'classic' ? "Classic (Normal)" : "Classic (Normal)";
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

    // Sistema Inteligente de Sinónimos y Omisión de marca automático
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

    // --- AQUÍ ESTÁ EL NUEVO SISTEMA DE TOLERANCIA PARA HIGH / LOW / MID ---
    if (gameMode === 'classic') {
        // En el modo de botones (Classic) se exige hacer click en el botón exacto
        isCorrect = (userAnswer === correctAnswer);
    } else {
        // En el modo teclado (Expert):
        // 1. Intentamos una comprobación directa estricta
        isCorrect = validAnswers.includes(userAnswer);
        
        // 2. Si falló, aplicamos el filtro "FLEXIBLE" para High, Low y Mid
        if (!isCorrect) {
            // Expresión regular que busca las palabras enteras 'high', 'low' o 'mid'
            const targetWords = /\b(high|low|mid)\b/gi;
            
            // Limpiamos la respuesta que ha escrito el usuario
            const cleanUser = userAnswer.replace(targetWords, '').replace(/\s+/g, ' ').trim();
            
            // Limpiamos todas las respuestas válidas permitidas por el sistema
            const cleanValids = validAnswers.map(ans => 
                ans.replace(targetWords, '').replace(/\s+/g, ' ').trim()
            );
            
            // Comparamos los textos limpios de etiquetas de altura
            isCorrect = cleanValids.includes(cleanUser);
        }
    }
    // ---------------------------------------------------------------------

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

// ==========================================================================
// NUEVAS FUNCIONALIDADES: TRADUCCIÓN E IDIOMA + COMPARTIR
// ==========================================================================

// 1. DICCIONARIO COMPLETO DE TRADUCCIONES (Música, Menú, Juego, Modales y Alertas)
const dictionary = {
    es: {
        scoreText: "PUNTOS",
        playBtn: "JUGAR",
        gameModeBtn: "MODO DE JUEGO",
        submitGuessBtn: "ADIVINAR",
        backToMenuBtn: "VOLVER AL MENÚ",
        
        // Modales e interfaces fijas
        statsTitle: "🏆 MIS RÉCORDS",
        totalPointsLabel: "PUNTOS TOTALES (DE SIEMPRE)",
        gameSettingsTitle: "⚙️ AJUSTES DE PARTIDA",
        gameModeHeading: "MODO DE JUEGO",
        difficultyHeading: "DIFICULTAD",
        infoTitle: "ℹ️ ¿CÓMO JUGAR?",
        infoBody: `<p style="margin-bottom: 15px; text-align: center; font-weight: 600; color: #ff6a00;">¡Demuestra tus conocimientos de cultura sneakerhead adivinando el calzado de la imagen!</p><hr style="border: 0; height: 1px; background: #333; margin-bottom: 15px;"><h3 style="color: #fff; font-size: 15px; margin-bottom: 5px;">🕹️ MODOS DE JUEGO</h3><ul style="margin-left: 20px; margin-bottom: 15px; padding-left: 5px;"><li><strong>Classic:</strong> Elige la respuesta correcta entre 4 opciones con botones.</li><li><strong>Expert:</strong> Pon a prueba tu memoria escribiendo la respuesta exacta.</li></ul><h3 style="color: #fff; font-size: 15px; margin-bottom: 5px;">🔥 DIFICULTADES</h3><ul style="margin-left: 20px; padding-left: 5px;"><li><strong style="color: #2ecc71;">Normal:</strong> Solo el <strong>Nombre del modelo</strong> (Ej: <em>Nike Air Jordan 1</em>).</li><li><strong style="color: #f1c40f;">Hard:</strong> Requiere <strong>Nombre + Colorway</strong> (Ej: <em>Nike Air Jordan 1 Chicago</em>).</li><li><strong style="color: #e74c3c;">Expert:</strong> Requiere <strong>Nombre + Colorway + Año</strong> (Ej: <em>Nike Air Jordan 1 Chicago 1985</em>).</li></ul>`,
        
        // Componentes internos de partida
        correctToast: (streak) => `✅ ¡Correcto! (Racha: ${streak})`,
        incorrectToast: "❌ ¡Fallaste!",
        exactAnswerWas: "La respuesta exacta era:",
        emptyJsonAlert: "El archivo zapatillas.json parece estar vacío.",
        criticalErrorAlert: "Error crítico al cargar zapatillas.json. Abre index.html usando 'Live Server'.",
        
        // Compartir en redes
        shareMessage: (streak, points) => `¡Llevo una racha de ${streak} aciertos y ${points} puntos en SneakerGuessr! ¿Podrás superarme? 👟🔥 Juega gratis aquí: https://sneakerguessr.com`,
        copiedAlert: "📋 ¡Texto de compartir copiado al portapapeles!"
    },
    en: {
        scoreText: "SCORE",
        playBtn: "PLAY",
        gameModeBtn: "GAME MODE",
        submitGuessBtn: "GUESS",
        backToMenuBtn: "BACK TO MENU",
        
        // Modales e interfaces fijas
        statsTitle: "🏆 MY RECORDS",
        totalPointsLabel: "TOTAL POINTS (ALL TIME)",
        gameSettingsTitle: "⚙️ GAME SETTINGS",
        gameModeHeading: "GAME MODE",
        difficultyHeading: "DIFFICULTY",
        infoTitle: "ℹ️ HOW TO PLAY?",
        infoBody: `<p style="margin-bottom: 15px; text-align: center; font-weight: 600; color: #ff6a00;">Prove your sneakerhead culture knowledge by guessing the footwear in the picture!</p><hr style="border: 0; height: 1px; background: #333; margin-bottom: 15px;"><h3 style="color: #fff; font-size: 15px; margin-bottom: 5px;">🕹️ GAME MODES</h3><ul style="margin-left: 20px; margin-bottom: 15px; padding-left: 5px;"><li><strong>Classic:</strong> Choose the correct answer from 4 options using buttons.</li><li><strong>Expert:</strong> Test your memory by typing the exact answer.</li></ul><h3 style="color: #fff; font-size: 15px; margin-bottom: 5px;">🔥 DIFFICULTIES</h3><ul style="margin-left: 20px; padding-left: 5px;"><li><strong style="color: #2ecc71;">Normal:</strong> Only the <strong>Model name</strong> (e.g., <em>Nike Air Jordan 1</em>).</li><li><strong style="color: #f1c40f;">Hard:</strong> Requires <strong>Name + Colorway</strong> (e.g., <em>Nike Air Jordan 1 Chicago</em>).</li><li><strong style="color: #e74c3c;">Expert:</strong> Requires <strong>Name + Colorway + Year</strong> (e.g., <em>Nike Air Jordan 1 Chicago 1985</em>).</li></ul>`,
        
        // Componentes internos de partida
        correctToast: (streak) => `✅ Correct! (Streak: ${streak})`,
        incorrectToast: "❌ Incorrect!",
        exactAnswerWas: "The exact answer was:",
        emptyJsonAlert: "The file zapatillas.json appears to be empty.",
        criticalErrorAlert: "Critical error loading zapatillas.json. Open index.html using 'Live Server'.",
        
        // Compartir en redes
        shareMessage: (streak, points) => `I'm on a streak of ${streak} correct answers and ${points} points on SneakerGuessr! Can you beat me? 👟🔥 Play for free here: https://sneakerguessr.com`,
        copiedAlert: "📋 Sharing text copied to clipboard!"
    }
};

// Variable de estado global para el idioma (por defecto comprueba localStorage o usa español)
let currentLang = localStorage.getItem("sneaker_lang") || "es";

// Función para aplicar la traducción en la interfaz de usuario por completo
function applyLanguage(lang) {
    const texts = dictionary[lang];
    
    // Traducir elementos principales e inputs dinámicos de juego
    if (document.getElementById("score-text")) document.getElementById("score-text").innerText = texts.scoreText;
    if (document.getElementById("play-btn")) document.getElementById("play-btn").innerText = texts.playBtn;
    if (document.getElementById("game-mode-setup-btn")) document.getElementById("game-mode-setup-btn").innerText = texts.gameModeBtn;
    if (document.getElementById("submit-guess")) document.getElementById("submit-guess").innerText = texts.submitGuessBtn;
    if (document.getElementById("back-to-menu-btn")) document.getElementById("back-to-menu-btn").innerText = texts.backToMenuBtn;
    
    // Traducir contenido estático dentro del Modal de Estadísticas
    const statsTitle = document.querySelector("#stats-modal h2");
    if (statsTitle) statsTitle.innerText = texts.statsTitle;
    
    const totalPointsLabel = document.querySelector("#stats-modal .stat-box.full-width .stat-label");
    if (totalPointsLabel) totalPointsLabel.innerText = texts.totalPointsLabel;
    
    // Traducir contenido estático del Modal de Ajustes de Partida
    const gameSettingsTitle = document.querySelector("#game-mode-modal h2");
    if (gameSettingsTitle) gameSettingsTitle.innerText = texts.gameSettingsTitle;
    
    const gameModeHeadings = document.querySelectorAll("#game-mode-modal h3");
    if (gameModeHeadings.length >= 2) {
        gameModeHeadings[0].innerText = texts.gameModeHeading;
        gameModeHeadings[1].innerText = texts.difficultyHeading;
    }
    
    // Traducir contenido estático del Modal Informativo (Cómo Jugar)
    const infoTitle = document.querySelector("#info-modal h2");
    if (infoTitle) infoTitle.innerText = texts.infoTitle;
    
    const infoBody = document.querySelector("#info-modal .modal-content > div");
    if (infoBody) infoBody.innerHTML = texts.infoBody;
    
    // Cambiar el icono visual del botón indicador de idioma
    const langBtn = document.getElementById("lang-btn");
    if (langBtn) langBtn.innerText = lang === "es" ? "🇪🇸" : "🇬🇧";

    // Actualizar instrucciones dinámicas en tiempo real si el usuario cambia el idioma en partida
    if (!gameScreen.classList.contains("hidden") && gameMode === 'expert') {
        updateExpertInstructions();
    }
}

// Evento para cambiar de idioma al pulsar el botón del globo 🌐
document.getElementById("lang-btn").addEventListener("click", () => {
    currentLang = currentLang === "es" ? "en" : "es";
    localStorage.setItem("sneaker_lang", currentLang);
    applyLanguage(currentLang);
});

// 2. FUNCIÓN SÚPER AVANZADA PARA COMPARTIR EN REDES
document.getElementById("share-btn").addEventListener("click", async () => {
    // Obtenemos los valores dinámicos actuales del juego
    const currentScore = score || 0; 
    const currentStreakVal = currentStreak || 0;
    
    const textToShare = dictionary[currentLang].shareMessage(currentStreakVal, currentScore);

    // Si el dispositivo acepta la API nativa de compartir (Móviles, Safari, etc.)
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
        // Alerta alternativa para ordenadores de escritorio (Copia el texto automáticamente)
        try {
            await navigator.clipboard.writeText(textToShare);
            alert(dictionary[currentLang].copiedAlert);
        } catch (err) {
            // Fallback extremo si falla el portapapeles automático
            alert(textToShare);
        }
    }
});

// Inicializar el idioma correcto al cargar la página web
document.addEventListener("DOMContentLoaded", () => {
    applyLanguage(currentLang);
});