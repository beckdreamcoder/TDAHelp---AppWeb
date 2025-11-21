import { CONVERSATIONS_KEY } from "./auth.js";

let conversations =
  JSON.parse(localStorage.getItem(CONVERSATIONS_KEY)) || [];
let currentConversation = null;

function saveConversations() {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
}

function createNewConversation() {
  currentConversation = {
    id: "conv_" + Date.now(),
    createdAt: new Date().toISOString(),
    messages: [],
  };
  return currentConversation;
}

function startNewConversation() {
  // Crear una nueva conversación
  currentConversation = {
    id: "conv_" + Date.now(),
    createdAt: new Date().toISOString(),
    messages: [],
  };

  ensureConversationRegistered();
  return currentConversation;
}



function ensureConversationRegistered() {
  if (!currentConversation) return;
  const idx = conversations.findIndex((c) => c.id === currentConversation.id);
  if (idx === -1) {
    conversations.push(currentConversation);
  } else {
    conversations[idx] = currentConversation;
  }
  saveConversations();
}

function logMessageToConversation(sender, text) {
  if (!currentConversation) return;
  currentConversation.messages.push({
    sender,
    text,
    timestamp: new Date().toISOString(),
  });
  ensureConversationRegistered();
}

function addMessageToCurrentConversation(sender, text) {
  if (!currentConversation) return;

  currentConversation.messages.push({
    sender,
    text,
    timestamp: new Date().toISOString(),
  });

  ensureConversationRegistered();
}

function renderConversationDetail(id) {
  const historyDetailEl = document.getElementById("historyDetail");
  if (!historyDetailEl) return;

  const conv = conversations.find((c) => c.id === id);
  if (!conv) return;

  historyDetailEl.innerHTML = "";

  const header = document.createElement("div");
  header.className = "history-detail-header";
  header.innerHTML = `
    <h3>Conversación</h3>
    <p>${new Date(conv.createdAt).toLocaleString("es-ES")}</p>
  `;
  historyDetailEl.appendChild(header);

  const wrapper = document.createElement("div");
  wrapper.className = "history-detail-messages";

  conv.messages.forEach((msg) => {
    const div = document.createElement("div");
    div.classList.add(
      "chat-message",
      msg.sender === "ai" ? "ai-message" : "user-message"
    );
    div.innerHTML = `<p>${msg.text.replace(/\n/g, "<br>")}</p>`;
    wrapper.appendChild(div);
  });

  historyDetailEl.appendChild(wrapper);
}

function renderHistoryList() {
  const historyListEl = document.getElementById("historyList");
  const historyDetailEl = document.getElementById("historyDetail");
  if (!historyListEl || !historyDetailEl) return;

  historyListEl.innerHTML = "";

  if (!conversations.length) {
    historyListEl.innerHTML =
      '<p class="history-empty">No hay conversaciones guardadas aún.</p>';
    historyDetailEl.innerHTML =
      '<p class="history-placeholder">Aún no tienes conversaciones para ver.</p>';
    return;
  }

  historyDetailEl.innerHTML =
    '<p class="history-placeholder">Selecciona una conversación para ver los detalles.</p>';

  const sorted = [...conversations].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  sorted.forEach((conv, index) => {
    const firstUserMsg = conv.messages.find((m) => m.sender === "user");
    const snippet = firstUserMsg
      ? firstUserMsg.text.length > 80
        ? firstUserMsg.text.slice(0, 80) + "…"
        : firstUserMsg.text
      : "Sin mensajes del usuario.";

    const date = new Date(conv.createdAt).toLocaleString("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
    });

    const div = document.createElement("div");
    div.className = "history-item";
    div.dataset.id = conv.id;
    div.innerHTML = `
      <h4>Conversación ${sorted.length - index}</h4>
      <p class="history-date">${date}</p>
      <p class="history-snippet">${snippet}</p>
    `;

    div.addEventListener("click", () => renderConversationDetail(conv.id));

    historyListEl.appendChild(div);
  });
}


function initHistory() {
  // Resetea vistas al entrar
  const historyView = document.getElementById("history-view");
  const chatView = document.getElementById("chat-view");
  const calendarView = document.getElementById("calendar-view");

  if (!historyView || !chatView || !calendarView) return;

  // Ocultamos historial de inicio, se muestra solo al hacer click
  historyView.classList.remove("active");

  // Cargar lista si ya existen conversaciones
  renderHistoryList();
}

export {
  createNewConversation,
  logMessageToConversation,
  renderHistoryList,
  addMessageToCurrentConversation,
  startNewConversation,
  initHistory
};