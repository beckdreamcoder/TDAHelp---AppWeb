// /js/tasks.js

import { TAREAS_KEY } from "./auth.js";
import { showToast } from "./utils.js";

let allTasks = [];
let calendarRef = null;

function setCalendar(calendarInstance) {
  calendarRef = calendarInstance;
}

function getAllTasks() {
  return allTasks;
}

function cargarTareas() {
  const data = localStorage.getItem(TAREAS_KEY);
  if (data) {
    allTasks = JSON.parse(data);
  } else {
    allTasks = [];
  }
}

function guardarTareas() {
  localStorage.setItem(TAREAS_KEY, JSON.stringify(allTasks));
}

// Clasificación de categoría (incluye examen/proyecto/estudio → Educación)
function asignarCategoria(titulo) {
  titulo = titulo.toLowerCase();

  if (
    titulo.includes("estudi") ||
    titulo.includes("estudio") ||
    titulo.includes("curso") ||
    titulo.includes("tarea") ||
    titulo.includes("examen") ||
    titulo.includes("exam") ||
    titulo.includes("evaluación") ||
    titulo.includes("proyecto") ||
    titulo.includes("tesis")
  ) {
    return { categoria: "Educación", color: "#0d6efd" };
  }

  if (
    titulo.includes("trabajo") ||
    titulo.includes("reunión") ||
    titulo.includes("oficina")
  )
    return { categoria: "Trabajo", color: "#198754" };

  if (
    titulo.includes("familia") ||
    titulo.includes("mam") ||
    titulo.includes("pap") ||
    titulo.includes("casa")
  )
    return { categoria: "Familia", color: "#fd7e14" };

  if (
    titulo.includes("salud") ||
    titulo.includes("gym") ||
    titulo.includes("ejercicio")
  )
    return { categoria: "Salud", color: "#dc3545" };

  if (
    titulo.includes("comprar") ||
    titulo.includes("limpiar") ||
    titulo.includes("rutina")
  )
    return { categoria: "Rutina", color: "#6f42c1" };

  return { categoria: "General", color: "#6b7280" };
}

function agregarNuevaTarea(tarea) {
  if (!tarea.id) tarea.id = "task_" + Date.now();

  const { categoria, color } = asignarCategoria(tarea.title);

  tarea.categoria = categoria;
  tarea.backgroundColor = tarea.backgroundColor || color;
  tarea.borderColor = tarea.borderColor || color;
  tarea.classNames = [categoria];

  allTasks.push(tarea);
  guardarTareas();

  if (calendarRef) {
    calendarRef.addEvent(tarea);
  }

  showToast(`Agregado: ${tarea.title} (${categoria})`);
}

// Parseo de bloques <TASK_SCHEDULE> que devuelve la IA
function parseAndScheduleTask(txt) {
  const regex = /<TASK_SCHEDULE>([\s\S]*?)<\/TASK_SCHEDULE>/g;
  const matches = [...txt.matchAll(regex)];

  let clean = txt;

  matches.forEach((m) => {
    try {
      const taskObj = JSON.parse(m[1].trim());
      agregarNuevaTarea(taskObj);
      clean = clean.replace(m[0], "");
    } catch (e) {
      console.error("Error parseando tarea:", e);
    }
  });

  return clean.trim();
}

// =====================
// MODAL DE TAREA
// =====================
function initTaskModal() {
  const taskModal = document.getElementById("taskModal");
  if (!taskModal) return;

  const taskModalForm = document.getElementById("taskModalForm");
  const taskModalCancel = document.getElementById("taskModalCancel");
  const taskModalError = document.getElementById("taskModalError");
  const modalTitle = document.getElementById("modal-title");
  const modalDate = document.getElementById("modal-date");
  const modalTime = document.getElementById("modal-time");
  const modalDuration = document.getElementById("modal-duration");

  function cerrarModalTarea() {
    taskModal.classList.remove("open");
    taskModal.setAttribute("aria-hidden", "true");
  }

  function abrirModalTarea() {
    const hoy = new Date();
    modalDate.value = hoy.toISOString().slice(0, 10);

    let minutes = hoy.getMinutes();
    const rounded = Math.ceil(minutes / 30) * 30;
    if (rounded === 60) {
      hoy.setHours(hoy.getHours() + 1);
      minutes = 0;
    } else {
      minutes = rounded;
    }
    const h = String(hoy.getHours()).padStart(2, "0");
    const m = String(minutes).padStart(2, "0");
    modalTime.value = `${h}:${m}`;

    modalTitle.value = "";
    modalDuration.value = 25;
    taskModalError.textContent = "";

    taskModal.classList.add("open");
    taskModal.setAttribute("aria-hidden", "false");
    modalTitle.focus();
  }

  // Nota: no hay botón visible que llame a abrirModalTarea,
  // pero la función queda por si luego quieres usarla desde otro botón.
  taskModalCancel.addEventListener("click", cerrarModalTarea);

  taskModal.addEventListener("click", (e) => {
    if (e.target.classList.contains("task-modal-backdrop")) {
      cerrarModalTarea();
    }
  });

  taskModalForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = modalTitle.value.trim();
    const date = modalDate.value;
    const time = modalTime.value;
    const duration = parseInt(modalDuration.value, 10) || 25;

    if (!title || !date || !time) {
      taskModalError.textContent = "Completa todos los campos.";
      return;
    }

    try {
      const start = new Date(`${date}T${time}:00`);
      const end = new Date(start.getTime() + duration * 60000);

      const tarea = {
        title,
        start: start.toISOString(),
        end: end.toISOString(),
      };

      agregarNuevaTarea(tarea);
      cerrarModalTarea();
    } catch (err) {
      console.error(err);
      taskModalError.textContent =
        "No se pudo crear la tarea. Revisa los datos.";
    }
  });

  // Exporto la función por si quieres abrir el modal desde otro módulo
  return { abrirModalTarea, cerrarModalTarea };
}

export {
  cargarTareas,
  guardarTareas,
  agregarNuevaTarea,
  parseAndScheduleTask,
  getAllTasks,
  setCalendar,
  initTaskModal,
};
