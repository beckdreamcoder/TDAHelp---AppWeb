// app.js (punto de entrada ES Module)
import { initAuthHeader } from "./auth.js";
import { cargarTareas } from "./tasks.js";
import { initCalendar } from "./calendar.js";
import { initHistory } from "./history.js";
import { initChat } from "./chat.js";
import { initNavigation } from "./navigation.js";

document.addEventListener("DOMContentLoaded", () => {
  // Datos de usuario
  initAuthHeader();

  // Tareas guardadas
  cargarTareas();

  // Historial (DOM refs)
  initHistory();

  // Calendario + filtros
  initCalendar();

  // Chat IA + conversación inicial
  initChat();

  // Navegación entre vistas
  initNavigation();
});
