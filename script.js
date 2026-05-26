// ELEMENTOS DEL HTML
const playBtn = document.getElementById("play-btn");
const difficultyBtn = document.getElementById("difficulty-btn");
const gameModeBtn = document.getElementById("game-mode-btn");
const statsBtn = document.getElementById("stats-btn");
const statsModal = document.getElementById("stats-modal");
const closeStatsBtn = document.getElementById("close-stats-btn");

const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");
const sneakerImg = document.getElementById("sneaker-img");
const optionsContainer = document.getElementById("options-container");
const expertContainer = document.getElementById("expert-mode-container");
const sneakerInput = document.getElementById("sneaker-input");
const submitBtn = document.getElementById("submit-guess");
const scoreVal = document.getElementById("score-val");

// NUEVOS: Selectores de Feedback Visual y Navegación
const backToMenuBtn = document.getElementById("back-to-menu-btn");
const feedbackToast = document.getElementById("feedback-toast");
const feedbackDetails = document.getElementById("feedback-details");

// VARIABLES DE ESTADO
let sneakers = [];
let currentSneaker = {};
let score = 0;
let gameMode = 'classic'; 
let currentStreak = 0;
const difficulties = ['normal', 'hard', 'expert'];
let difficultyIndex = 0; 

// NUEVOS: Mecanismos de control de tiempos
let feedbackTimeout = null;
let isProcessingAnswer = false; // Bloquea clics repetidos durante los 2 segundos de pausa

// EVENTOS DE CONTROL
playBtn.addEventListener("click", () => {
    menuScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    startGame();
});

gameModeBtn.addEventListener("click", () => {
    gameMode = (gameMode === 'classic') ? 'expert' : 'classic';
    gameModeBtn.innerText = `MODE: ${gameMode.toUpperCase()}`;
    currentStreak = 0;
    if (!gameScreen.classList.contains("hidden")) {
        nextQuestion();
    }
});

difficultyBtn.addEventListener("click", () => {
    if (gameMode !== 'expert') {
        alert("¡La dificultad solo afecta a las reglas del modo EXPERT! Cambia primero el MODE a EXPERT.");
        return;
    }
    difficultyIndex = (difficultyIndex + 1) % difficulties.length;
    const currentDiff = difficulties[difficultyIndex];
    difficultyBtn.innerText = `DIFFICULTY: ${currentDiff.toUpperCase()}`;
    currentStreak = 0;
    if (!gameScreen.classList.contains("hidden")) {
        updateExpertInstructions();
    }
});

statsBtn.addEventListener("click", openStatsModal);
closeStatsBtn.addEventListener("click", () => statsModal.classList.add("hidden"));

window.addEventListener("click", (e) => {
    if (e.target === statsModal) {
        statsModal.classList.add("hidden");
    }
});

// NUEVO: Evento para el botón de Volver al menú
backToMenuBtn.addEventListener("click", () => {
    // Si el usuario vuelve al menú en medio de los 2 segundos de corrección, cancelamos el temporizador
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
    isProcessingAnswer = false;
    
    // Limpiamos rastros visuales
    feedbackToast.classList.add("hidden");
    feedbackDetails.classList.add("hidden");
    
    // Cambiamos pantallas
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
});

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
        
        nextQuestion();
    } catch (error) {
        alert("Error crítico al cargar zapatillas.json. Recuerda abrir el index.html usando 'Live Server' en VS Code.");
        console.error(error);
    }
}

function nextQuestion() {
    currentSneaker = sneakers[Math.floor(Math.random() * sneakers.length)];
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
        instructionEl.innerText = "Modo: NORMAL\n📝 Escribe solo el nombre del modelo\nEjemplo: Nike Air Force 1";
        sneakerInput.placeholder = "Nombre del modelo...";
    } else if (diff === 'hard') {
        instructionEl.innerText = "Modo: DIFÍCIL\n🎨 Estructura: Nombre + Colorway\nEjemplo: Nike Air Force 1 Triple Black";
        sneakerInput.placeholder = "Nombre + Colorway...";
    } else if (diff === 'expert') {
        instructionEl.innerText = "Modo: EXPERTO 🔥\n📅 Estructura: Nombre + Colorway + Año\nEjemplo: Nike Air Force 1 Triple Black 1982";
        sneakerInput.placeholder = "Nombre + Colorway + Año...";
    }
}

function generateButtons() {
    optionsContainer.innerHTML = ""; 
    let options = [currentSneaker.nombre];
    
    while (options.length < 4 && options.length < sneakers.length) {
        let randomSneaker = sneakers[Math.floor(Math.random() * sneakers.length)];
        if (!options.includes(randomSneaker.nombre)) {
            options.push(randomSneaker.nombre);
        }
    }
    
    options.sort(() => Math.random() - 0.5);

    options.forEach(name => {
        const btn = document.createElement("button");
        btn.classList.add("answer-btn");
        btn.innerText = name;
        btn.onclick = () => checkAnswer(name);
        optionsContainer.appendChild(btn);
    });
}

sneakerInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        checkAnswer(sneakerInput.value);
    }
});

submitBtn.addEventListener("click", () => {
    checkAnswer(sneakerInput.value);
});

function openStatsModal() {
    document.getElementById("total-points-val").innerText = localStorage.getItem("sneaker_total_points") || "0";
    document.getElementById("streak-classic-val").innerText = localStorage.getItem("sneaker_streak_classic") || "0";
    document.getElementById("streak-normal-val").innerText = localStorage.getItem("sneaker_streak_expert_normal") || "0";
    document.getElementById("streak-hard-val").innerText = localStorage.getItem("sneaker_streak_expert_hard") || "0";
    document.getElementById("streak-expert-val").innerText = localStorage.getItem("sneaker_streak_expert_expert") || "0";
    
    statsModal.classList.remove("hidden");
}

// VALIDACIÓN DE RESPUESTAS ADAPTADA A RETROALIMENTACIÓN EN PANTALLA
function checkAnswer(guess) {
    // Si ya estamos mostrando una corrección, ignoramos cualquier clic extra
    if (isProcessingAnswer) return;
    isProcessingAnswer = true;

    const userAnswer = guess.toLowerCase().trim();
    let correctAnswer = "";
    let isCorrect = false;

    if (gameMode === 'classic') {
        correctAnswer = currentSneaker.nombre.toLowerCase().trim();
        const brand = currentSneaker.marca.toLowerCase().trim();
        const nameWithoutBrand = correctAnswer.replace(brand, "").trim();

        isCorrect = 
            userAnswer === correctAnswer || 
            userAnswer === nameWithoutBrand || 
            (userAnswer.length >= 4 && correctAnswer.includes(userAnswer));

    } else {
        const diff = difficulties[difficultyIndex];
        const nombreBase = currentSneaker.nombre.toLowerCase().trim();
        const colorwayBase = (currentSneaker.colorway || "").toLowerCase().trim();
        const elAnioReal = currentSneaker.año || currentSneaker.anio || currentSneaker.lanzamiento || "";
        const anioBase = elAnioReal.toString().trim();

        if (diff === 'normal') {
            correctAnswer = nombreBase;
        } else if (diff === 'hard') {
            correctAnswer = `${nombreBase} ${colorwayBase}`.trim();
        } else if (diff === 'expert') {
            correctAnswer = `${nombreBase} ${colorwayBase} ${anioBase}`.trim();
        }

        isCorrect = (userAnswer === correctAnswer);
    }

    // CONSTRUCCIÓN DE LA RESPUESTA CORRECTA PARA REVELAR EN CASO DE FALLO
    let respuestaRevelada = currentSneaker.nombre;
    if (gameMode === 'expert') {
        const diff = difficulties[difficultyIndex];
        if (diff === 'hard') respuestaRevelada += ` - [${currentSneaker.colorway}]`;
        if (diff === 'expert') {
            const elAnioReal = currentSneaker.año || currentSneaker.anio || currentSneaker.lanzamiento || "";
            respuestaRevelada += ` - [${currentSneaker.colorway}] - [${elAnioReal}]`;
        }
    }

    // PROCESADO DE HISTÓRICOS, MARCADORES Y RENDERIZADO VISUAL
    if (isCorrect) {
        score += 10;
        currentStreak++;
        
        let totalPointsSaved = parseInt(localStorage.getItem("sneaker_total_points") || "0");
        totalPointsSaved += 10;
        localStorage.setItem("sneaker_total_points", totalPointsSaved);

        let keyModo = (gameMode === 'classic') ? 'classic' : `expert_${difficulties[difficultyIndex]}`;
        let recordRachaGuardada = parseInt(localStorage.getItem(`sneaker_streak_${keyModo}`) || "0");
        if (currentStreak > recordRachaGuardada) {
            localStorage.setItem(`sneaker_streak_${keyModo}`, currentStreak);
        }

        // Mostrar cartel dinámico VERDE nativo
        feedbackToast.innerText = `✅ ¡Correcto! (Racha: ${currentStreak})`;
        feedbackToast.className = "feedback-banner correct";
        feedbackToast.classList.remove("hidden");
    } else {
        currentStreak = 0;

        // Mostrar cartel dinámico ROJO nativo
        feedbackToast.innerText = "❌ ¡Fallaste!";
        feedbackToast.className = "feedback-banner incorrect";
        feedbackToast.classList.remove("hidden");

        // Pintar la corrección abajo del cuadro
        feedbackDetails.innerHTML = `La respuesta exacta era:<br><strong>${respuestaRevelada}</strong>`;
        feedbackDetails.classList.remove("hidden");
    }
    
    scoreVal.innerText = score;

    // REPARACIÓN DEL FLUJO: Espera de 2 segundos antes de limpiar y saltar de pregunta
    feedbackTimeout = setTimeout(() => {
        feedbackToast.classList.add("hidden");
        feedbackDetails.classList.add("hidden");
        isProcessingAnswer = false; // Desbloqueamos el control
        nextQuestion();
    }, 2000);
}