const formatter = new Intl.NumberFormat("sv-SE");

const defaults = {
  steps: 12486,
  goal: 20000,
  theme: "neon",
  align: "bottom-right",
  scale: 100,
  sessionStart: 12066,
  source: "manual",
  deviceName: ""
};

const params = new URLSearchParams(window.location.search);
const isOverlay = params.get("mode") === "overlay";

const stored = JSON.parse(localStorage.getItem("stepcast-state") || "null");
const state = {
  ...defaults,
  ...(stored || {}),
  steps: Number(params.get("steps") || stored?.steps || defaults.steps),
  goal: Number(params.get("goal") || stored?.goal || defaults.goal),
  theme: params.get("theme") || stored?.theme || defaults.theme,
  align: params.get("align") || stored?.align || defaults.align,
  scale: Number(params.get("scale") || stored?.scale || defaults.scale)
};
let syncReady = false;
let lastSyncPayload = "";

const els = {
  app: document.getElementById("app"),
  overlayPreview: document.getElementById("overlayPreview"),
  overlayCard: document.querySelector(".overlay-card"),
  overlaySteps: document.getElementById("overlaySteps"),
  goalText: document.getElementById("goalText"),
  percentText: document.getElementById("percentText"),
  progressFill: document.getElementById("progressFill"),
  paceText: document.getElementById("paceText"),
  leftText: document.getElementById("leftText"),
  stepsInput: document.getElementById("stepsInput"),
  goalInput: document.getElementById("goalInput"),
  scaleInput: document.getElementById("scaleInput"),
  obsUrl: document.getElementById("obsUrl"),
  savedState: document.getElementById("savedState"),
  statusPill: document.getElementById("statusPill"),
  sourceSummary: document.getElementById("sourceSummary")
};

if (isOverlay) {
  document.body.classList.add("overlay-mode");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function save() {
  localStorage.setItem("stepcast-state", JSON.stringify(state));
  els.savedState.textContent = syncReady ? "Synkad med OBS" : "Sparad lokalt";
}

async function pullServerState() {
  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) return;
    const next = await response.json();
    syncReady = true;
    Object.assign(state, next);
    localStorage.setItem("stepcast-state", JSON.stringify(state));
    render();
  } catch {
    syncReady = false;
  }
}

async function pushServerState() {
  try {
    const payload = JSON.stringify(state);
    if (payload === lastSyncPayload) return;
    lastSyncPayload = payload;
    const response = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload
    });
    syncReady = response.ok;
  } catch {
    syncReady = false;
  }
}

function obsUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("mode", "overlay");
  url.searchParams.set("theme", state.theme);
  url.searchParams.set("align", state.align);
  url.searchParams.set("scale", state.scale);
  return url.toString();
}

async function copyObsUrl() {
  const text = obsUrl();
  try {
    await navigator.clipboard.writeText(text);
    els.savedState.textContent = "OBS URL kopierad";
  } catch {
    els.savedState.textContent = "Kopiera URL manuellt";
  }
}

function render() {
  const goal = Math.max(1, Number(state.goal) || defaults.goal);
  const steps = Math.max(0, Number(state.steps) || 0);
  const percent = clamp(Math.round((steps / goal) * 100), 0, 999);
  const progress = clamp((steps / goal) * 100, 0, 100);
  const left = Math.max(0, goal - steps);
  const sessionDelta = Math.max(0, steps - (state.sessionStart || 0));
  const sourceLabel = state.source === "wearable"
    ? state.deviceName || "Wearable"
    : state.source === "api"
      ? "API bridge"
      : "Manual input";
  const sourceSummary = state.source === "wearable"
    ? `${sourceLabel} is sending steps to StepCast.`
    : "Manual input is active. Connect a phone, watch bridge, or shortcut later.";

  els.overlaySteps.textContent = formatter.format(steps);
  els.goalText.textContent = `${formatter.format(goal)} goal`;
  els.percentText.textContent = `${percent}%`;
  els.progressFill.style.width = `${progress}%`;
  els.paceText.textContent = `${sourceLabel} +${formatter.format(sessionDelta)}`;
  els.leftText.textContent = left > 0 ? `${formatter.format(left)} kvar` : "Mål nått";
  els.stepsInput.value = steps;
  els.goalInput.value = goal;
  els.scaleInput.value = state.scale;
  els.obsUrl.textContent = obsUrl();
  els.sourceSummary.textContent = sourceSummary;

  els.overlayCard.className = `overlay-card theme-${state.theme}`;
  els.overlayCard.style.transform = `scale(${state.scale / 100})`;
  els.overlayPreview.className = `overlay-stage align-${state.align}`;
  els.statusPill.textContent = isOverlay ? "Overlay live" : sourceLabel;

  document.querySelectorAll(".theme-choice").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.theme === state.theme);
  });
  document.querySelectorAll(".position-grid button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.align === state.align);
  });
}

function update(partial) {
  Object.assign(state, { source: "manual" }, partial);
  save();
  pushServerState();
  render();
}

document.getElementById("plus100")?.addEventListener("click", () => update({ steps: state.steps + 100 }));
document.getElementById("minus100")?.addEventListener("click", () => update({ steps: Math.max(0, state.steps - 100) }));
document.getElementById("demoBtn")?.addEventListener("click", () => update({ steps: state.steps + 250 }));
document.getElementById("resetBtn")?.addEventListener("click", () => update({ steps: 0, sessionStart: 0 }));
document.getElementById("copyUrl")?.addEventListener("click", copyObsUrl);
document.getElementById("copyTop")?.addEventListener("click", copyObsUrl);

els.stepsInput?.addEventListener("input", (event) => {
  update({ steps: Math.max(0, Number(event.target.value) || 0) });
});

els.goalInput?.addEventListener("input", (event) => {
  update({ goal: Math.max(1, Number(event.target.value) || 1) });
});

els.scaleInput?.addEventListener("input", (event) => {
  update({ scale: Number(event.target.value) || defaults.scale });
});

document.querySelectorAll(".theme-choice").forEach((button) => {
  button.addEventListener("click", () => update({ theme: button.dataset.theme }));
});

document.querySelectorAll(".position-grid button").forEach((button) => {
  button.addEventListener("click", () => update({ align: button.dataset.align }));
});

window.addEventListener("storage", (event) => {
  if (event.key !== "stepcast-state" || !event.newValue) return;
  Object.assign(state, JSON.parse(event.newValue));
  render();
});

pullServerState().finally(render);

if (isOverlay) {
  window.setInterval(pullServerState, 1000);
} else {
  window.setInterval(pullServerState, 5000);
}
