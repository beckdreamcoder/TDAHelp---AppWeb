// /js/app.js

import { setupHeaderAndSidebar } from "./auth.js";
import { initChat, startNewConversation } from "./chat.js";
import { cargarTareas, initTaskModal } from "./tasks.js";
import { initCalendar, setupCalendarFilters } from "./calendar.js";
import { initNavigation } from "./navigation.js";

// 1. Header y sidebar para el usuario actual
setupHeaderAndSidebar();

// 2. Cargar tareas desde localStorage
cargarTareas();

// 3. Inicializar calendario y filtros
initCalendar();
setupCalendarFilters();

// 4. Inicializar chat e historial
initChat();

// 5. Modal de tareas (queda disponible aunque no haya botón visible)
initTaskModal();

// 6. Navegación entre vistas
initNavigation();

// 7. Crear primera conversación con saludo del asistente
startNewConversation();
