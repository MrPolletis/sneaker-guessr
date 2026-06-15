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
            alert("El archivo zapatillas.json parece estar vacío.");
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
        alert("Error crítico al cargar zapatillas.json. Abre index.html usando 'Live Server'.");
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
    const diff = difficulties[difficultyIndex];
    
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
    const diff = difficulties[difficultyIndex];
    document.getElementById("total-points-val").innerText = localStorage.getItem("sneaker_total_points") || "0";
    
    document.getElementById("streak-classic-normal-val").innerText = localStorage.getItem("sneaker_streak_classic_normal") || "0";
    document.getElementById("streak-classic-hard-val").innerText = localStorage.getItem("sneaker_streak_classic_hard") || "0";
    document.getElementById("streak-classic-expert-val").innerText = localStorage.getItem("sneaker_streak_classic_expert") || "0";
    
    document.getElementById("streak-expert-normal-val").innerText = localStorage.getItem("sneaker_streak_expert_normal") || "0";
    document.getElementById("streak-expert-hard-val").innerText = localStorage.getItem("sneaker_streak_expert_hard") || "0";
    document.getElementById("streak-expert-expert-val").innerText = localStorage.getItem("sneaker_streak_expert_expert") || "0";
    
    statsModal.classList.remove("hidden");
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

        feedbackToast.innerText = `✅ ¡Correcto! (Racha: ${currentStreak})`;
        feedbackToast.className = "feedback-banner correct";
        feedbackToast.classList.remove("hidden");
    } else {
        currentStreak = 0;

        feedbackToast.innerText = "❌ ¡Fallaste!";
        feedbackToast.className = "feedback-banner incorrect";
        feedbackToast.classList.remove("hidden");

        feedbackDetails.innerHTML = `La respuesta exacta era:<br><strong>${respuestaRevelada}</strong>`;
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