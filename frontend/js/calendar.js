// /js/calendar.js

import { getAllTasks, setCalendar as registerCalendarInTasks } from "./tasks.js";

let calendar = null;
let categoriaActiva = "ALL";

function aplicarFiltroCalendario() {
  if (!calendar) return;
  const eventos = calendar.getEvents();

  eventos.forEach((ev) => {
    const cat =
      ev.extendedProps.categoria ||
      ev.extendedProps.category ||
      ev.extendedProps.categoria;

    const mostrar =
      categoriaActiva === "ALL" || (cat && cat === categoriaActiva);

    ev.setProp("display", mostrar ? "auto" : "none");
  });
}

function initCalendar() {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) return;

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

    events: getAllTasks(),
    editable: true,

    eventClick(info) {
      const ok = confirm(`¿Eliminar "${info.event.title}"?`);
      if (!ok) return;

      const id = info.event.id;
      // Ojo: los datos en localStorage se actualizan desde tasks.js;
      // aquí solo removemos del calendario.
      info.event.remove();
      // El borrado real de allTasks lo gestiona tasks.js si lo deseas extender
      alert("Tarea eliminada del calendario (falta sync de storage si lo necesitas aquí).");
    },
  });

  registerCalendarInTasks(calendar);

  setTimeout(() => {
    calendar.render();
    calendar.updateSize();
    aplicarFiltroCalendario();
  }, 100);
}

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
