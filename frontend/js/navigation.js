// frontend/js/navigation.js
import { renderHistoryList } from "./history.js";
import { getCalendar, refreshCalendar } from "./calendar.js";


function initNavigation() {
  const navChat = document.getElementById("nav-chat");
  const navCalendar = document.getElementById("nav-calendar");
  const navLogout = document.getElementById("nav-logout");

  const chatView = document.getElementById("chat-view");
  const calendarView = document.getElementById("calendar-view");
  const historyView = document.getElementById("history-view");
  const navEstadisticas = document.getElementById("nav-estadisticas");
  const statsView = document.getElementById("stats-view");


  const btnVerHistorial = document.getElementById("btn-ver-historial");

  if (navCalendar && chatView && calendarView && historyView) {
    navCalendar.addEventListener("click", (e) => {
      e.preventDefault();

      calendarView.classList.add("active");
      chatView.classList.remove("active");
      historyView.classList.remove("active");
      if (statsView) statsView.classList.remove("active");

      navCalendar.classList.add("active");
      navChat.classList.remove("active");
      if (navEstadisticas) navEstadisticas.classList.remove("active");

      // 🔥 NUEVO: forzar recalculo del calendario
      const cal = getCalendar();
      if (cal) {
        setTimeout(() => {
          cal.render();
          cal.updateSize();
        }, 50);
      }
    });


  }

  if (navEstadisticas && statsView) {
    navEstadisticas.addEventListener("click", (e) => {
      e.preventDefault();

      statsView.classList.add("active");
      chatView.classList.remove("active");
      calendarView.classList.remove("active");
      historyView.classList.remove("active");

      navEstadisticas.classList.add("active");
      navChat.classList.remove("active");
      navCalendar.classList.remove("active");
    });

  }


  if (navChat && chatView && calendarView && historyView) {
    navChat.addEventListener("click", (e) => {
      e.preventDefault();

      chatView.classList.add("active");
      calendarView.classList.remove("active");
      historyView.classList.remove("active");
      if (statsView) statsView.classList.remove("active");

      navChat.classList.add("active");
      navCalendar.classList.remove("active");
      if (navEstadisticas) navEstadisticas.classList.remove("active");
    });

  }

  if (navLogout) {
    navLogout.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      window.location.href = "index.html";
    });
  }

  if (btnVerHistorial && chatView && calendarView && historyView) {
    btnVerHistorial.addEventListener("click", () => {

    historyView.classList.add("active");
    chatView.classList.remove("active");
    calendarView.classList.remove("active");
    if (statsView) statsView.classList.remove("active");

    navChat.classList.remove("active");
    navCalendar.classList.remove("active");
    if (navEstadisticas) navEstadisticas.classList.remove("active");

    renderHistoryList();
  });

  }
}

export { initNavigation };
