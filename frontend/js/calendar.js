// /js/calendar.js

import { getAllTasks, registerCalendarInstance } from "./tasks.js";

let calendar = null;
let categoriaActiva = "ALL";

// ======================================================
// APLICAR FILTRO VISUAL POR CATEGORÍA
// ======================================================
function aplicarFiltroCalendario() {
  if (!calendar) return;

  calendar.getEvents().forEach((ev) => {
    const cat = ev.extendedProps.categoria;
    const mostrar =
      categoriaActiva === "ALL" || (cat && cat === categoriaActiva);

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
    backgroundColor: t.backgroundColor, // ✔ color correcto
    borderColor: t.borderColor,         // ✔ borde correcto
    textColor: "#ffffff",
    categoria: t.categoria,             // ✔ categoría para filtro
    extendedProps: {
      categoria: t.categoria,
    },
  }));

  calendar = new FullCalendar.Calendar(calendarEl, {
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

  setTimeout(() => {
    calendar.render();
    calendar.updateSize();
    aplicarFiltroCalendario();
  }, 100);
}

// ======================================================
function setupCalendarFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  if (!filterButtons.length) return;

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));

      btn.classList.add("active");
      categoriaActiva = btn.dataset.category;

      aplicarFiltroCalendario();
    });
  });
}

// ======================================================
function refreshCalendar() {
  if (!calendar) return;
  calendar.render();
  calendar.updateSize();
  aplicarFiltroCalendario();
}

function getCalendar() {
  return calendar;
}

export { initCalendar, setupCalendarFilters, refreshCalendar, getCalendar };
