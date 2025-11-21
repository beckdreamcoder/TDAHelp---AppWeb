// /js/navigation.js

import { renderHistoryList } from "./history.js";
import { refreshCalendar } from "./calendar.js";
import { startNewConversation } from "./chat.js";
import { showToast } from "./utils.js";

function initNavigation() {
  const navChat = document.getElementById("nav-chat");
  const navCalendar = document.getElementById("nav-calendar");
  const navLogout = document.getElementById("nav-logout");

  const chatView = document.getElementById("chat-view");
  const calendarView = document.getElementById("calendar-view");
  const historyView = document.getElementById("history-view");

  const btnNuevaConversacion = document.getElementById(
    "btn-nueva-conversacion"
  );
  const btnVerHistorial = document.getElementById("btn-ver-historial");

  if (navCalendar && navChat && chatView && calendarView && historyView) {
    navCalendar.addEventListener("click", (e) => {
      e.preventDefault();

      chatView.classList.remove("active");
      historyView.classList.remove("active");
      calendarView.classList.add("active");

      navChat.classList.remove("active");
      navCalendar.classList.add("active");

      refreshCalendar();
    });

    navChat.addEventListener("click", (e) => {
      e.preventDefault();

      calendarView.classList.remove("active");
      historyView.classList.remove("active");
      chatView.classList.add("active");

      navCalendar.classList.remove("active");
      navChat.classList.add("active");
    });
  }

  if (navLogout) {
    navLogout.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      window.location.href = "index.html";
    });
  }

  if (btnNuevaConversacion) {
    btnNuevaConversacion.addEventListener("click", () => {
      startNewConversation();
      showToast("Nueva conversación iniciada");
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
