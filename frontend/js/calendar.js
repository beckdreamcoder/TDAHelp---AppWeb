import { getAllTasks, registerCalendarInstance } from "./tasks.js";

let calendar = null;
let categoriaActiva = "ALL";

// ======================================================
// APLICAR FILTRO VISUAL POR CATEGORÍA
// ======================================================
function aplicarFiltroCalendario() {
  if (!calendar) return;

  // Recorremos los eventos renderizados y ocultamos/mostramos
  calendar.getEvents().forEach((ev) => {
    // Accedemos a la propiedad extendida que definimos abajo
    const cat = ev.extendedProps.categoria;
    
    // Lógica: Si está en "ALL" o si la categoría coincide exactamente
    const mostrar = categoriaActiva === "ALL" || (cat && cat === categoriaActiva);

    // FullCalendar v5/v6 permite ocultar eventos sin borrarlos usando 'display'
    ev.setProp("display", mostrar ? "auto" : "none");
  });
}

// ======================================================
// INICIALIZAR CALENDARIO
// ======================================================
function initCalendar() {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) return;

  // 🔥 Convertimos tareas → eventos FullCalendar
  const eventos = getAllTasks().map((t) => ({
    id: t.id,
    title: t.title,
    start: t.start,
    end: t.end,
    backgroundColor: t.backgroundColor,
    borderColor: t.borderColor,
    textColor: "#ffffff",
    // Guardamos la categoría en extendedProps para poder filtrarla
    extendedProps: {
      categoria: t.categoria, 
    },
  }));

  calendar = new FullCalendar.Calendar(calendarEl, {
    eventOverlap: true,
    slotEventOverlap: false,
    eventMinHeight: 25,        // Altura mínima por evento
slotEventOverlap: false,   // Evita que los eventos se pongan a la derecha
eventMaxStack: 100,        // Fuerza apilar eventos siempre en vertical
eventOrder: "start",       // Orden cronológico


    initialView: "timeGridWeek",
    locale: "es",
    height: "auto",
    expandRows: true,
    nowIndicator: true,
    slotDuration: "00:30:00",
    scrollTime: "07:00:00",
    slotMinTime: "06:00:00",
    slotMaxTime: "23:30:00",
    allDaySlot: false,

    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
    },

    buttonText: {
      today: "Hoy",
      month: "Mes",
      week: "Semana",
      day: "Día",
      list: "Agenda",
    },

    events: eventos,
    editable: true,

    eventClick(info) {
      const ok = confirm(`¿Eliminar "${info.event.title}"?`);
      if (!ok) return;
      info.event.remove();
    },
  });

  registerCalendarInstance(calendar);

  // Renderizamos el calendario
  calendar.render();

  // 🔥 CORRECCIÓN 1: Llamamos a la configuración de los botones aquí
  setupCalendarFilters();

  // Aplicamos el filtro inicial por si acaso
  setTimeout(() => {
    calendar.updateSize();
    aplicarFiltroCalendario();
  }, 100);
}

// ======================================================
// CONFIGURAR LISTENERS DE LOS BOTONES
// ======================================================
function setupCalendarFilters() {
  // 🔥 CORRECCIÓN 2: Usamos la clase correcta '.cat-btn' (antes decía .filter-btn)
  const filterButtons = document.querySelectorAll(".cat-btn");
  
  if (!filterButtons.length) {
    console.warn("No se encontraron botones de filtro (.cat-btn)");
    return;
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // 1. Quitar clase 'active' a todos
      filterButtons.forEach((b) => b.classList.remove("active"));

      // 2. Poner 'active' al presionado
      btn.classList.add("active");

      // 3. Actualizar variable de estado
      categoriaActiva = btn.dataset.category; // Lee data-category="Educación"

      console.log("Filtro cambiado a:", categoriaActiva); // Debug

      // 4. Re-evaluar qué eventos se muestran
      aplicarFiltroCalendario();
    });
  });
}

// ======================================================
function refreshCalendar() {
  if (!calendar) return;
  // Opcional: recargar eventos si getAllTasks cambió
  // const nuevosEventos = getAllTasks().map(...) 
  // calendar.removeAllEvents();
  // calendar.addEventSource(nuevosEventos);
  
  calendar.render();
  calendar.updateSize();
  aplicarFiltroCalendario();
}

function getCalendar() {
  return calendar;
}

export { initCalendar, setupCalendarFilters, refreshCalendar, getCalendar };