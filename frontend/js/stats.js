// stats.js
import { TAREAS_KEY, currentUserEmail } from "./auth.js";

const EVENTS_KEY_PREFIX = "task_events_"; // se guarda por usuario
const EVENTS_KEY = `${EVENTS_KEY_PREFIX}${currentUserEmail}`;

let donutChart = null;
let barChart = null;

function loadTasks() {
  const raw = localStorage.getItem(TAREAS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function loadEvents() {
  const raw = localStorage.getItem(EVENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Si los eventos no existen, crear array vacío
function ensureEventsInit() {
  if (!localStorage.getItem(EVENTS_KEY)) {
    localStorage.setItem(EVENTS_KEY, JSON.stringify([]));
  }
}

// Calcular métricas
function calculateStats(tasks, events) {
  const totalTasks = tasks.length;

  // Si events tienen taskId, contamos tareas completadas únicas
  const taskIds = events
    .map((e) => e.taskId)
    .filter((x) => x !== undefined && x !== null);

  let completedCount;
  if (taskIds.length) {
    // contar únicos
    const uniq = new Set(taskIds);
    completedCount = uniq.size;
  } else {
    // fallback: usar cantidad de eventos
    completedCount = events.length;
  }

  const pendingCount = Math.max(0, totalTasks - completedCount);
  const percent = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);

  return { totalTasks, completedCount, pendingCount, percent };
}

// Serie diaria (últimos N días, default 14)
function seriesByDay(events, days = 14) {
  const today = new Date();
  const map = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map[key] = 0;
  }

  events.forEach((ev) => {
    const d = new Date(ev.timestamp);
    if (isNaN(d)) return;
    const key = d.toISOString().slice(0, 10);
    if (map.hasOwnProperty(key)) map[key] += 1;
  });

  const labels = Object.keys(map);
  const values = labels.map((k) => map[k]);
  return { labels, values };
}

// RENDER
function renderCards({ totalTasks, completedCount, pendingCount, percent }) {
  document.getElementById("stat-total").textContent = totalTasks;
  document.getElementById("stat-completed").textContent = completedCount;
  document.getElementById("stat-pending").textContent = pendingCount;
  document.getElementById("stat-percent").textContent = `${percent}%`;

  const msgEl = document.getElementById("stats-message");
  if (percent >= 80 && totalTasks > 0) {
    msgEl.textContent = "¡Excelente progreso! ✅ Sigue así.";
  } else if (percent >= 50 && totalTasks > 0) {
    msgEl.textContent = "Buen ritmo. Mantén la constancia. 💪";
  } else if (totalTasks === 0) {
    msgEl.textContent = "Aún no tienes tareas. Intenta agendar alguna. ➡️";
  } else {
    msgEl.textContent = "Ánimo — organiza pequeñas metas y avanza. ✨";
  }
}

function renderDonut(completed, pending) {
  const ctx = document.getElementById("chart-donut").getContext("2d");

  // 🚨 Evitar que se haga enorme — destruir si ya existe
  if (donutChart !== null) {
    donutChart.destroy();
  }

  donutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Completadas", "Pendientes"],
      datasets: [
        {
          data: [completed, pending],
          backgroundColor: ["#4caf50", "#f44336"],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // para que NO crezca infinito
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}


function renderBar(labels, values) {
  const ctx = document.getElementById("chart-bar").getContext("2d");
  if (barChart) barChart.destroy();
  barChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Completadas",
          data: values,
          backgroundColor: "#0d6efd",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { maxRotation: 30, minRotation: 0 } },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}

function refreshAll() {
  ensureEventsInit();
  const tasks = loadTasks();
  const events = loadEvents();
  const stats = calculateStats(tasks, events);
  renderCards(stats);
  renderDonut(stats.completedCount, stats.pendingCount);
  const series = seriesByDay(events, 14);
  renderBar(series.labels, series.values);
}

// NAV / UI wiring
function initStatsView() {
  const navStats = document.getElementById("nav-estadisticas");
  const chatView = document.getElementById("chat-view");
  const calendarView = document.getElementById("calendar-view");
  const historyView = document.getElementById("history-view");
  const statsView = document.getElementById("stats-view");
  const btnRefresh = document.getElementById("btn-refresh-stats");

  if (navStats && statsView && chatView && calendarView && historyView) {
    navStats.addEventListener("click", (e) => {
      e.preventDefault();
      // ocultar otras vistas
      chatView.classList.remove("active");
      calendarView.classList.remove("active");
      historyView.classList.remove("active");
      statsView.classList.add("active");

      // active class styling menu
      const navChat = document.getElementById("nav-chat");
      const navCalendar = document.getElementById("nav-calendar");
      if (navChat) navChat.classList.remove("active");
      if (navCalendar) navCalendar.classList.remove("active");
      navStats.classList.add("active");

      // cargar la data
      refreshAll();
    });
  }

  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => refreshAll());
  }

  // Si la página abre directamente en stats (opcional)
  if (statsView && statsView.classList.contains("active")) {
    refreshAll();
  }
}

// Auto init (si se ejecuta en la SPA)
document.addEventListener("DOMContentLoaded", initStatsView);
