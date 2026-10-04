// ---------- Config ----------
const DURATIONS = {
  work: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};
const MESSAGES = {
  work: "Time to focus!",
  short: "Take a short break.",
  long: "Enjoy a long break.",
};
const RING_LENGTH = 2 * Math.PI * 54;

// ---------- State ----------
let mode = "work";
let remaining = DURATIONS[mode];
let intervalId = null;
let completedWork = 0;

// ---------- DOM ----------
const app = document.getElementById("app");
const timeEl = document.getElementById("time");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const ring = document.getElementById("ring");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const modeBtns = document.querySelectorAll(".mode-btn");

// ---------- Rendering (dynamic DOM manipulation) ----------
function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function render() {
  timeEl.textContent = formatTime(remaining);
  document.title = `${formatTime(remaining)} - Pomodoro`;
  const progress = 1 - remaining / DURATIONS[mode];
  ring.style.strokeDashoffset = RING_LENGTH * progress;
  countEl.textContent = completedWork;
  app.dataset.mode = mode;
  modeBtns.forEach((btn) => {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active);
  });
}

// ---------- Audio alert (Web Audio API, no file needed) ----------
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.3, 0.6].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.value = 0.2;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.2);
    });
  } catch (e) {
    console.warn("Audio not supported", e);
  }
}

function flashIndicator() {
  app.classList.remove("flash");
  void app.offsetWidth; // restart animation
  app.classList.add("flash");
}

// ---------- Timer logic using setInterval() ----------
function tick() {
  remaining--;
  render();
  if (remaining <= 0) {
    completeSession();
  }
}

function start() {
  if (intervalId !== null) return;
  intervalId = setInterval(tick, 1000);
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  statusEl.textContent = MESSAGES[mode];
}

function pause() {
  clearInterval(intervalId);
  intervalId = null;
  startBtn.disabled = false;
  startBtn.textContent = "Resume";
  pauseBtn.disabled = true;
  statusEl.textContent = "Paused";
}

function reset() {
  clearInterval(intervalId);
  intervalId = null;
  remaining = DURATIONS[mode];
  startBtn.disabled = false;
  startBtn.textContent = "Start";
  pauseBtn.disabled = true;
  statusEl.textContent = MESSAGES[mode];
  render();
}

function switchMode(newMode) {
  mode = newMode;
  reset();
}

// ---------- Session transitions ----------
function completeSession() {
  clearInterval(intervalId);
  intervalId = null;
  beep();
  flashIndicator();

  if (mode === "work") {
    completedWork++;
    // Every 4th work session earns a long break
    switchMode(completedWork % 4 === 0 ? "long" : "short");
  } else {
    switchMode("work");
  }
  statusEl.textContent = "Session complete! " + MESSAGES[mode];
}

// ---------- Event listeners ----------
startBtn.addEventListener("click", start);
pauseBtn.addEventListener("click", pause);
resetBtn.addEventListener("click", reset);
modeBtns.forEach((btn) =>
  btn.addEventListener("click", () => switchMode(btn.dataset.mode))
);

// Keyboard shortcut: Space toggles start/pause
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && e.target === document.body) {
    e.preventDefault();
    intervalId === null ? start() : pause();
  }
});

render();
