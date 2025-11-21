// frontend/js/navigation.js
import { renderHistoryList } from "./history.js";

function initNavigation() {
  const navChat = document.getElementById("nav-chat");
  const navCalendar = document.getElementById("nav-calendar");
  const navLogout = document.getElementById("nav-logout");

  const chatView = document.getElementById("chat-view");
  const calendarView = document.getElementById("calendar-view");
  const historyView = document.getElementById("history-view");

  const btnVerHistorial = document.getElementById("btn-ver-historial");

  if (navCalendar && chatView && calendarView && historyView) {
    navCalendar.addEventListener("click", (e) => {
      e.preventDefault();
      chatView.classList.remove("active");
      historyView.classList.remove("active");
      calendarView.classList.add("active");

      if (navChat && navCalendar) {
        navChat.classList.remove("active");
        navCalendar.classList.add("active");
      }
    });
  }

  if (navChat && chatView && calendarView && historyView) {
    navChat.addEventListener("click", (e) => {
      e.preventDefault();
      calendarView.classList.remove("active");
      historyView.classList.remove("active");
      chatView.classList.add("active");

      navChat.classList.add("active");
      if (navCalendar) navCalendar.classList.remove("active");
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
      chatView.classList.remove("active");
      calendarView.classList.remove("active");
      historyView.classList.add("active");

      if (navChat && navCalendar) {
        navChat.classList.remove("active");
        navCalendar.classList.remove("active");
      }

      renderHistoryList();
    });
  }
}

export { initNavigation };
