/* Concurs Sudoku – Cercul de Jocuri Logice */
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbwNWT1H5acOAAff0vTNqmF9y3-D2iiNkRIpuOEkKl5eSgX89bccVFzNM96n74v0AmEA/exec";

const levelSequence = [3, 3, 4, 5];
const levelTime = { 3: 30, 4: 60, 5: 120 };

let solution = [], size = 3, timerInterval = null, timeLeft = 0;
let totalStartTime = 0, currentLevelIndex = 0, started = false, busy = false;

const $ = (id) => document.getElementById(id);

/* ---------- generare ---------- */
function generateLatinSquare(n) {
    const grid = Array.from({ length: n }, () => Array(n).fill(0));
    function canPlace(r, c, num) {
        for (let i = 0; i < n; i++) if (grid[r][i] === num || grid[i][c] === num) return false;
        return true;
    }
    function solve(cell = 0) {
        if (cell === n * n) return true;
        const r = Math.floor(cell / n), c = cell % n;
        const nums = [...Array(n).keys()].map(x => x + 1).sort(() => Math.random() - 0.5);
        for (const num of nums) {
            if (canPlace(r, c, num)) {
                grid[r][c] = num;
                if (solve(cell + 1)) return true;
                grid[r][c] = 0;
            }
        }
        return false;
    }
    solve();
    return grid;
}

/* numără soluțiile (maxim 2) ca să fim siguri că problema are un singur răspuns */
function countSolutions(puzzle, limit = 2) {
    const n = puzzle.length;
    const g = puzzle.map(r => [...r]);
    let count = 0;
    function ok(r, c, v) {
        for (let i = 0; i < n; i++) if (g[r][i] === v || g[i][c] === v) return false;
        return true;
    }
    function go(cell) {
        if (count >= limit) return;
        if (cell === n * n) { count++; return; }
        const r = Math.floor(cell / n), c = cell % n;
        if (g[r][c] !== 0) { go(cell + 1); return; }
        for (let v = 1; v <= n; v++) {
            if (ok(r, c, v)) { g[r][c] = v; go(cell + 1); g[r][c] = 0; }
        }
    }
    go(0);
    return count;
}

function generatePuzzle(n) {
    const grid = generateLatinSquare(n);
    solution = grid.map(r => [...r]);
    const puzzle = grid.map(r => [...r]);
    const target = Math.floor(n * n * 0.4);
    const cells = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) cells.push([r, c]);
    cells.sort(() => Math.random() - 0.5);
    let removed = 0;
    for (const [r, c] of cells) {
        if (removed >= target) break;
        const keep = puzzle[r][c];
        puzzle[r][c] = 0;
        if (countSolutions(puzzle) === 1) removed++;
        else puzzle[r][c] = keep;
    }
    return puzzle;
}

/* ---------- afișare ---------- */
function renderBoard(puzzle) {
    const board = $("board");
    board.innerHTML = "";
    board.style.setProperty("--n", puzzle.length);
    puzzle.forEach((row, r) => {
        row.forEach((val, c) => {
            const input = document.createElement("input");
            input.type = "text";
            input.maxLength = 1;
            input.className = "cell";
            input.dataset.row = r;
            input.dataset.col = c;
            input.inputMode = "numeric";
            input.autocomplete = "off";
            input.setAttribute("aria-label", `Rândul ${r + 1}, coloana ${c + 1}`);
            if (val !== 0) { input.value = val; input.disabled = true; input.classList.add("given"); }
            board.appendChild(input);
        });
    });
    const first = board.querySelector(".cell:not(:disabled)");
    if (first) first.focus();
}

function setMessage(text, kind) {
    const m = $("message");
    m.textContent = text;
    m.className = "contest-message" + (kind ? " " + kind : "");
}

function updateProgress() {
    document.querySelectorAll("#progress li").forEach((li, i) => {
        li.classList.toggle("done", i < currentLevelIndex);
        li.classList.toggle("current", i === currentLevelIndex && started);
    });
    const info = $("level-info");
    info.textContent = currentLevelIndex < levelSequence.length
        ? `Nivelul ${currentLevelIndex + 1} din ${levelSequence.length} · tabel ${size}×${size} · cifre de la 1 la ${size}`
        : "";
}

/* ---------- cronometru ---------- */
function startTimer() {
    clearInterval(timerInterval);
    timeLeft = levelTime[size];
    updateTimer();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            setMessage("Timp expirat! Poți continua, dar timpul total rulează.", "warn");
        }
    }, 1000);
}
function updateTimer() {
    const t = Math.max(timeLeft, 0);
    const min = Math.floor(t / 60), sec = t % 60;
    const el = $("timer");
    el.textContent = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    el.classList.toggle("low", t <= 10);
}

/* ---------- desfășurare ---------- */
function startContest() {
    const name = $("username").value.trim();
    if (!name) {
        setMessage("Scrie numele concurentului înainte de start.", "warn");
        $("username").focus();
        return;
    }
    started = true;
    currentLevelIndex = 0;
    totalStartTime = Date.now();
    $("username").disabled = true;
    $("start-area").hidden = true;
    $("play-area").hidden = false;
    nextLevel();
}

function nextLevel() {
    if (currentLevelIndex >= levelSequence.length) { finishContest(); return; }
    size = levelSequence[currentLevelIndex];
    renderBoard(generatePuzzle(size));
    setMessage("");
    updateProgress();
    startTimer();
    busy = false;
}

function readGrid() {
    const g = Array.from({ length: size }, () => Array(size).fill(0));
    document.querySelectorAll(".cell").forEach(inp => {
        g[inp.dataset.row][inp.dataset.col] = parseInt(inp.value) || 0;
    });
    return g;
}

function checkSolution() {
    if (busy || !started) return;
    const g = readGrid();
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
        if (g[r][c] !== solution[r][c]) {
            setMessage("Mai încearcă! Verifică rândurile și coloanele.", "warn");
            return;
        }
    }
    busy = true;
    clearInterval(timerInterval);
    setMessage(`Bravo! Ai rezolvat nivelul ${currentLevelIndex + 1}.`, "ok");
    currentLevelIndex++;
    updateProgress();
    setTimeout(nextLevel, 1600);
}

function clearMistakes() {
    document.querySelectorAll(".cell").forEach(inp => {
        if (!inp.disabled && inp.value && parseInt(inp.value) !== solution[inp.dataset.row][inp.dataset.col]) {
            inp.value = "";
            inp.classList.remove("wrong");
        }
    });
    setMessage("Am șters cifrele greșite.");
}

function formatTime(sec) {
    return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

function finishContest() {
    clearInterval(timerInterval);
    const total = formatTime(Math.floor((Date.now() - totalStartTime) / 1000));
    $("play-area").hidden = true;
    $("end-area").hidden = false;
    setMessage("");
    $("final-time").textContent = total;
    $("final-name").textContent = $("username").value.trim();
    updateProgress();
    sendFinalTime(total);
}

function sendFinalTime(formattedTime) {
    const name = $("username").value.trim();
    const status = $("send-status");
    status.textContent = "Se trimite rezultatul…";
    fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ name: name, time: formattedTime })
    }).then(() => {
        status.textContent = "Rezultatul a fost trimis.";
    }).catch(() => {
        status.textContent = "Nu s-a putut trimite rezultatul. Verifică internetul și anunță profesorul.";
    });
}

/* ---------- evenimente ---------- */
document.addEventListener("DOMContentLoaded", () => {
    $("start-btn").addEventListener("click", startContest);
    $("check-btn").addEventListener("click", checkSolution);
    $("clear-btn").addEventListener("click", clearMistakes);
    $("new-btn").addEventListener("click", () => location.reload());
    $("username").addEventListener("keydown", (e) => { if (e.key === "Enter") startContest(); });

    $("board").addEventListener("input", (e) => {
        const inp = e.target;
        if (!inp.classList.contains("cell")) return;
        const v = inp.value.replace(/[^0-9]/g, "");
        inp.value = (v && parseInt(v) >= 1 && parseInt(v) <= size) ? v : "";
        if (inp.value) {
            const cells = [...document.querySelectorAll(".cell:not(:disabled)")];
            const next = cells[cells.indexOf(inp) + 1];
            if (next) next.focus();
        }
    });
    $("board").addEventListener("keydown", (e) => {
        if (e.key === "Enter") { checkSolution(); return; }
        const inp = e.target;
        if (!inp.classList.contains("cell")) return;
        const r = +inp.dataset.row, c = +inp.dataset.col;
        const move = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
        if (!move) return;
        e.preventDefault();
        const t = document.querySelector(`.cell[data-row="${r + move[0]}"][data-col="${c + move[1]}"]`);
        if (t && !t.disabled) t.focus();
    });
});
