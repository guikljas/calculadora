"use strict";

/* ========================================
   1. ELEMENTOS E ESTADO DA APLICAÇÃO
======================================== */

const HISTORY_KEY = "formCalculatorHistory";
const SETTINGS_KEY = "formCalculatorSettings";
const MAX_HISTORY = 50;
const display = document.querySelector("#display");
const historyList = document.querySelector("#history-list");
const emptyHistory = document.querySelector("#empty-history");
const themeButton = document.querySelector("#theme-toggle");
const menuButton = document.querySelector("#menu-toggle");
const helpPanel = document.querySelector("#help-panel");

let expression = "";
let history = [];
let settings = { theme: "light" };

/* ========================================
   2. PERSISTÊNCIA LOCAL
======================================== */

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* armazenamento indisponível */
  }
}
function normalizeNumber(value) {
  return Number.isInteger(value)
    ? String(value)
    : String(Number(value.toPrecision(12)));
}
function expressionLabel(value) {
  return value.replaceAll("*", "×").replaceAll("/", "÷").replaceAll("-", "−");
}

/* ========================================
   3. VISOR E LEITURA DA EXPRESSÃO
======================================== */

function updateDisplay() {
  display.textContent = expression || "0";
  display.setAttribute(
    "aria-label",
    expression
      ? `Expressão: ${expressionLabel(expression)}`
      : "Expressão vazia",
  );
}

function tokenize(value) {
  const compact = value.replaceAll(" ", "");
  if (!compact) return null;
  const tokens = [];
  let index = 0;
  let expectsNumber = true;
  while (index < compact.length) {
    if (expectsNumber) {
      const match = compact.slice(index).match(/^-?(?:\d+(?:\.\d*)?|\.\d+)/);
      if (!match) return null;
      tokens.push(Number(match[0]));
      index += match[0].length;
      expectsNumber = false;
    } else {
      const operator = compact[index];
      if (!"+-*/".includes(operator)) return null;
      tokens.push(operator);
      index++;
      expectsNumber = true;
    }
  }
  return expectsNumber ? null : tokens;
}

function evaluate(value) {
  const tokens = tokenize(value);
  if (!tokens) return null;
  const reduced = [tokens[0]];
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i],
      number = tokens[i + 1];
    if ((op === "*" || op === "/") && op === "/" && number === 0) return null;
    if (op === "*") reduced[reduced.length - 1] *= number;
    else if (op === "/") reduced[reduced.length - 1] /= number;
    else reduced.push(op, number);
  }
  let result = reduced[0];
  for (let i = 1; i < reduced.length; i += 2)
    result =
      reduced[i] === "+" ? result + reduced[i + 1] : result - reduced[i + 1];
  return Number.isFinite(result) ? result : null;
}

/* ========================================
   4. AÇÕES DA CALCULADORA
======================================== */

function append(value) {
  if (expression === "Erro") expression = "";
  if (/\d/.test(value) && expression === "0") expression = "";
  if (value === ".") {
    const current = expression.split(/[+*/]/).pop()?.replace(/^-/, "") ?? "";
    if (current.includes(".")) return;
    expression += current ? "." : "0.";
  } else if ("+-*/".includes(value)) {
    if (!expression && value !== "-") return;
    if (expression.endsWith("-")) expression = expression.slice(0, -1) + value;
    else if (/[+*/]$/.test(expression))
      expression =
        value === "-" ? expression + value : expression.slice(0, -1) + value;
    else expression += value;
  } else expression += value;
  updateDisplay();
}

function clearDisplay() {
  expression = "";
  updateDisplay();
}
function backspace() {
  expression = expression === "Erro" ? "" : expression.slice(0, -1);
  updateDisplay();
}
function calculate() {
  const result = evaluate(expression);
  if (result === null) {
    expression = "Erro";
    updateDisplay();
    return;
  }
  const original = expression;
  expression = normalizeNumber(result);
  updateDisplay();
  addHistory(original, result);
}
function toggleSign() {
  if (!expression || expression === "Erro") {
    expression = "-";
    updateDisplay();
    return;
  }
  const match = expression.match(/(-?)(?:\d+(?:\.\d*)?|\.\d+)$/);
  if (!match) return;
  const start = match.index;
  const segment = match[0];
  expression =
    expression.slice(0, start) +
    (segment.startsWith("-") ? segment.slice(1) : `-${segment}`);
  updateDisplay();
}
function calculatePercentage() {
  const tokens = tokenize(expression);
  if (!tokens) {
    expression = "Erro";
    updateDisplay();
    return;
  }
  const last = tokens.length - 1;
  if (tokens.length === 1) expression = normalizeNumber(tokens[0] / 100);
  else {
    const previous = evaluate(tokens.slice(0, -2).join(""));
    const operator = tokens[last - 1];
    const percentage =
      operator === "+" || operator === "-"
        ? (previous * tokens[last]) / 100
        : tokens[last] / 100;
    expression = `${tokens.slice(0, -1).join("")}${normalizeNumber(percentage)}`;
  }
  updateDisplay();
}

/* ========================================
   5. HISTÓRICO
======================================== */

function dateTitle(iso) {
  const date = new Date(iso),
    today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const difference = Math.round((today - day) / 86400000);
  if (difference === 0) return "Hoje";
  if (difference === 1) return "Ontem";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  }).format(date);
}
function loadHistory() {
  const saved = readJSON(HISTORY_KEY, []);
  history = Array.isArray(saved)
    ? saved
        .filter(
          (item) =>
            item &&
            typeof item.expression === "string" &&
            Number.isFinite(item.result) &&
            !Number.isNaN(Date.parse(item.time)),
        )
        .slice(0, MAX_HISTORY)
    : [];
}
function addHistory(source, result) {
  const last = history[0];
  if (last?.expression === source && last.result === result) return;
  history.unshift({
    expression: source,
    result,
    time: new Date().toISOString(),
  });
  history = history.slice(0, MAX_HISTORY);
  writeJSON(HISTORY_KEY, history);
  renderHistory();
}
function renderHistory() {
  historyList.replaceChildren();
  emptyHistory.hidden = history.length > 0;
  document.querySelector("#clear-history").disabled = history.length === 0;
  let previousTitle = "";
  history.forEach((item, index) => {
    const title = dateTitle(item.time);
    if (title !== previousTitle) {
      const heading = document.createElement("p");
      heading.className = "history-group-title";
      heading.textContent = title;
      historyList.append(heading);
      previousTitle = title;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = `history-item${index === 0 ? " latest" : ""}`;
    const time = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(item.time));
    const info = document.createElement("span");
    info.className = "history-info";
    const source = document.createElement("span");
    source.className = "history-expression";
    source.textContent = expressionLabel(item.expression);
    const clock = document.createElement("span");
    clock.className = "history-time";
    clock.textContent = time;
    const resultRow = document.createElement("span");
    resultRow.className = "history-result-row";
    const result = document.createElement("span");
    result.className = "history-result";
    result.textContent = normalizeNumber(item.result);
    info.append(source, clock);
    resultRow.append(result);
    if (index === 0) {
      const badge = document.createElement("small");
      badge.className = "history-latest-label";
      badge.textContent = "RECENTE";
      resultRow.append(badge);
    }
    button.append(info, resultRow);
    button.setAttribute(
      "aria-label",
      `Usar resultado ${normalizeNumber(item.result)} da expressão ${expressionLabel(item.expression)}`,
    );
    button.addEventListener("click", () => {
      expression = normalizeNumber(item.result);
      updateDisplay();
    });
    historyList.append(button);
  });
}

/* ========================================
   6. TEMA E MENU
======================================== */

function applyTheme() {
  const dark = settings.theme === "dark";
  document.body.classList.toggle("dark-mode", dark);
  themeButton.textContent = dark ? "☾" : "☀";
  themeButton.setAttribute(
    "aria-label",
    dark ? "Ativar modo claro" : "Ativar modo escuro",
  );
  themeButton.setAttribute("aria-pressed", String(dark));
}
function toggleTheme() {
  settings.theme = settings.theme === "dark" ? "light" : "dark";
  writeJSON(SETTINGS_KEY, settings);
  applyTheme();
}
function setMenu(open) {
  helpPanel.hidden = !open;
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  if (open) document.querySelector("#menu-close").focus();
}

/* ========================================
   7. EVENTOS E INICIALIZAÇÃO
======================================== */

document.querySelector(".buttons").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.value) append(button.dataset.value);
  else
    ({
      clear: clearDisplay,
      backspace,
      calculate,
      sign: toggleSign,
      percent: calculatePercentage,
    })[button.dataset.action]?.();
});
document.querySelector("#clear-history").addEventListener("click", () => {
  history = [];
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {}
  renderHistory();
});
themeButton.addEventListener("click", toggleTheme);
menuButton.addEventListener("click", () => setMenu(helpPanel.hidden));
document.querySelector("#menu-close").addEventListener("click", () => {
  setMenu(false);
  menuButton.focus();
});
document.addEventListener("keydown", (event) => {
  if (
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    event.target.matches("input, textarea, select, [contenteditable='true']")
  )
    return;
  const key = event.key;
  if (/^\d$/.test(key)) append(key);
  else if ("+-*/".includes(key)) {
    event.preventDefault();
    append(key);
  } else if (key === "." || key === ",") append(".");
  else if (key === "Enter" || key === "=") {
    event.preventDefault();
    calculate();
  } else if (key === "Backspace") {
    event.preventDefault();
    backspace();
  } else if (key === "Escape") {
    if (!helpPanel.hidden) setMenu(false);
    else clearDisplay();
  } else if (key === "Delete") {
    event.preventDefault();
    clearDisplay();
  } else if (key === "%") {
    event.preventDefault();
    calculatePercentage();
  }
});

loadHistory();
const savedSettings = readJSON(SETTINGS_KEY, {});
if (["light", "dark"].includes(savedSettings.theme)) settings = savedSettings;
applyTheme();
updateDisplay();
renderHistory();
