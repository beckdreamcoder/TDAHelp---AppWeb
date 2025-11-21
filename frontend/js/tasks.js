// /js/tasks.js
import { TAREAS_KEY } from "./auth.js";
import { showToast } from "./utils.js";

let allTasks = [];
let calendarInstance = null;

// Permitir que calendar registre su instancia
export function registerCalendarInstance(calendar) {
  calendarInstance = calendar;
}

// Para otros módulos (calendar) que necesiten acceder a las tareas
export function getAllTasks() {
  return allTasks;
}

// ---------- CATEGORÍAS ----------
function asignarCategoriaInterna(titulo) {
  const t = titulo.toLowerCase();

  // EDUCACIÓN
  if (
    t.includes("estudi") ||
    t.includes("estudio") ||
    t.includes("curso") ||
    t.includes("tarea") ||
    t.includes("examen") ||
    t.includes("evaluación") ||
    t.includes("proyecto") ||
    t.includes("tesis")
  ) {
    return { categoria: "Educación", color: "#0d6efd" };
  }

  // TRABAJO
  if (t.includes("trabajo") || t.includes("reunión") || t.includes("oficina")) {
    return { categoria: "Trabajo", color: "#198754" };
  }

  // FAMILIA
  if (
    t.includes("familia") ||
    t.includes("mam") ||
    t.includes("pap") ||
    t.includes("casa")
  ) {
    return { categoria: "Familia", color: "#fd7e14" };
  }

  // SALUD
  if (
    t.includes("salud") ||
    t.includes("gym") ||
    t.includes("gimnasio") ||
    t.includes("ejercicio") ||
    t.includes("entrenar")
  ) {
    return { categoria: "Salud", color: "#dc3545" };
  }

  // RUTINA
  if (
    t.includes("comprar") ||
    t.includes("limpiar") ||
    t.includes("rutina")
  ) {
    return { categoria: "Rutina", color: "#6f42c1" }; // morado
  }

  // GENERAL
  return { categoria: "General", color: "#6b7280" };
}

export function asignarCategoria(titulo) {
  return asignarCategoriaInterna(titulo);
}

// Normaliza tareas viejas o nuevas
function normalizarTarea(tarea) {
  if (!tarea.id) {
    tarea.id = "task_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  }

  const info = asignarCategoriaInterna(tarea.title || tarea.titulo || "");
  tarea.categoria = info.categoria;
  tarea.backgroundColor = info.color;
  tarea.borderColor = info.color;

  tarea.classNames = [tarea.categoria];

  return tarea;
}

// ---------- CRUD LOCALSTORAGE ----------
export function cargarTareas() {
  const data = localStorage.getItem(TAREAS_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      allTasks = parsed.map(normalizarTarea);
    } catch {
      allTasks = [];
    }
  } else {
    allTasks = [];
  }
  return allTasks;
}

export function guardarTareas() {
  localStorage.setItem(TAREAS_KEY, JSON.stringify(allTasks));
}

export function agregarNuevaTarea(tarea) {
  const normalizada = normalizarTarea(tarea);
  allTasks.push(normalizada);
  guardarTareas();

  if (calendarInstance) {
    calendarInstance.addEvent({
      ...normalizada,
      extendedProps: { categoria: normalizada.categoria },
      textColor: "#fff",
    });
  }

  showToast(`Agregado: ${normalizada.title} (${normalizada.categoria})`);
}

export function eliminarTarea(id) {
  allTasks = allTasks.filter((t) => t.id !== id);
  guardarTareas();
}

export function actualizarTareaDesdeCalendar(event) {
  const tIndex = allTasks.findIndex((t) => t.id === event.id);
  if (tIndex === -1) return;
  allTasks[tIndex].start = event.start.toISOString();
  allTasks[tIndex].end = event.end ? event.end.toISOString() : null;
  guardarTareas();
}

// ---------- PARSEO DESDE LA IA ----------
export function parseAndScheduleTask(txt) {
  const regex = /<TASK_SCHEDULE>([\s\S]*?)<\/TASK_SCHEDULE>/g;
  const matches = [...txt.matchAll(regex)];
  let clean = txt;

  matches.forEach((m) => {
    try {
      let taskObj = JSON.parse(m[1].trim());

      // 🔥 NORMALIZAR SIEMPRE
      taskObj = normalizarTarea(taskObj);

      // Guardar
      allTasks.push(taskObj);
      guardarTareas();

      // Añadir al calendario
      if (calendarInstance) {
        calendarInstance.addEvent({
          ...taskObj,
          extendedProps: { categoria: taskObj.categoria },
          textColor: "#fff",
        });
      }

      clean = clean.replace(m[0], "");
    } catch (e) {
      console.error("Error parseando tarea:", e);
    }
  });

  return clean.trim();
}
