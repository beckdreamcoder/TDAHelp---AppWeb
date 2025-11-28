import { CONVERSATIONS_KEY } from "./auth.js";

let conversations = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY)) || [];
let currentConversation = null;

function saveConversations() {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
}

// --- TUS FUNCIONES ORIGINALES ---
function createNewConversation() {
  currentConversation = {
    id: "conv_" + Date.now(),
    createdAt: new Date().toISOString(),
    messages: [],
  };
  return currentConversation;
}

function startNewConversation() {
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

// --- LÓGICA DE RETOMAR (RESTORE) ---
function resumeConversation(convId) {
  const found = conversations.find(c => c.id === convId);
  if (!found) return;

  currentConversation = found;

  const chatbox = document.getElementById("chatbox");
  if (chatbox) {
    chatbox.innerHTML = "";
    found.messages.forEach(msg => {
      // Reutilizamos la lógica de renderizado visual aquí también
      const msgDiv = document.createElement("div");
      msgDiv.classList.add("chat-message", msg.sender === 'ai' ? 'ai-message' : 'user-message');
      
      let contentHTML = "";
      
      // Si es la IA, agregamos el avatar (Asegúrate que la ruta sea correcta)
      if (msg.sender === 'ai') {
          contentHTML += `<img src="/images/IconoRobot.png" alt="AI" class="chat-avatar">`;
      }

      // El globo de texto
      contentHTML += `
        <div class="message-content">
            ${msg.text.replace(/\n/g, "<br>")}
        </div>
      `;

      msgDiv.innerHTML = contentHTML;
      chatbox.appendChild(msgDiv);
    });
    chatbox.scrollTop = chatbox.scrollHeight;
  }

  document.getElementById("history-view").classList.remove("active");
  document.getElementById("chat-view").classList.add("active");
  
  document.querySelectorAll(".sidebar-menu li").forEach(li => li.classList.remove("active"));
  document.getElementById("nav-chat").classList.add("active");
}

// --- LÓGICA: ELIMINAR (DELETE) ---
function deleteConversation(convId) {
  const confirmacion = confirm("¿Estás seguro de que deseas eliminar esta conversación permanentemente?");
  if (!confirmacion) return;

  conversations = conversations.filter(c => c.id !== convId);
  saveConversations();

  if (currentConversation && currentConversation.id === convId) {
    currentConversation = null;
    const chatbox = document.getElementById("chatbox");
    if(chatbox) chatbox.innerHTML = ""; 
  }

  renderHistoryList();
  
  const historyDetailEl = document.getElementById("historyDetail");
  historyDetailEl.innerHTML = '<p class="history-placeholder">Conversación eliminada correctamente.</p>';
}

// --- RENDERIZADO DE DETALLES (AQUÍ ESTÁ LA MAGIA VISUAL) ---
function renderConversationDetail(id) {
  const historyDetailEl = document.getElementById("historyDetail");
  if (!historyDetailEl) return;

  const conv = conversations.find((c) => c.id === id);
  if (!conv) return;

  historyDetailEl.innerHTML = "";

  // 1. HEADER
  const header = document.createElement("div");
  header.className = "history-detail-header";
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  
  const infoDiv = document.createElement("div");
  infoDiv.innerHTML = `
      <h3>Conversación</h3>
      <p style="font-size: 0.8em; color: #666;">${new Date(conv.createdAt).toLocaleString("es-ES")}</p>
  `;
  header.appendChild(infoDiv);

  // 2. BOTONES CON ESTILO (Usando las clases history-btn)
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "history-btn-group"; // Clase contenedora

  // Botón Retomar
  const resumeBtn = document.createElement("button");
  resumeBtn.className = "history-btn btn-resume"; // Clases visuales
  resumeBtn.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i> Retomar';
  resumeBtn.addEventListener("click", () => resumeConversation(conv.id));

  // Botón Eliminar
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "history-btn btn-delete"; // Clases visuales
  deleteBtn.title = "Eliminar conversación";
  deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>'; 
  deleteBtn.addEventListener("click", () => deleteConversation(conv.id));

  actionsDiv.appendChild(resumeBtn);
  actionsDiv.appendChild(deleteBtn);
  
  header.appendChild(actionsDiv);
  historyDetailEl.appendChild(header);

  // 3. LISTA DE MENSAJES CON ESTILO DE CHAT
  const wrapper = document.createElement("div");
  wrapper.className = "history-detail-messages";

  conv.messages.forEach((msg) => {
    const div = document.createElement("div");
    // Clases base (izquierda o derecha)
    div.classList.add(
      "chat-message",
      msg.sender === "ai" ? "ai-message" : "user-message"
    );

    let innerHTMLContent = "";

    // A) Si es la IA, ponemos el icono del robot primero
    if (msg.sender === "ai") {
        // Asumiendo que esta es la ruta de tu imagen según tu HTML original
        innerHTMLContent += `<img src="/images/IconoRobot.png" alt="TDAHelp" class="chat-avatar" style="width: 30px; height: 30px; margin-right: 8px; border-radius: 50%;">`;
    }

    // B) El globo del mensaje (IMPORTANTE: clase 'message-content')
    innerHTMLContent += `
        <div class="message-content">
            ${msg.text.replace(/\n/g, "<br>")}
        </div>
    `;

    div.innerHTML = innerHTMLContent;
    wrapper.appendChild(div);
  });

  historyDetailEl.appendChild(wrapper);
}

// --- LISTADO LATERAL ---
function renderHistoryList() {
  const historyListEl = document.getElementById("historyList");
  const historyDetailEl = document.getElementById("historyDetail");
  if (!historyListEl || !historyDetailEl) return;

  historyListEl.innerHTML = "";

  if (!conversations.length) {
    historyListEl.innerHTML =
      '<p class="history-empty">No hay conversaciones guardadas aún.</p>';
    if (!historyDetailEl.innerHTML.includes("eliminada correctamente")) {
         historyDetailEl.innerHTML = '<p class="history-placeholder">Aún no tienes conversaciones para ver.</p>';
    }
    return;
  }

  if (!historyDetailEl.innerHTML.includes("eliminada correctamente") && historyDetailEl.innerHTML.includes("history-placeholder")) {
      historyDetailEl.innerHTML = '<p class="history-placeholder">Selecciona una conversación.</p>';
  }

  const sorted = [...conversations].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  sorted.forEach((conv, index) => {
    const firstUserMsg = conv.messages.find((m) => m.sender === "user");
    const snippet = firstUserMsg
      ? firstUserMsg.text.length > 50
        ? firstUserMsg.text.slice(0, 50) + "…"
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
  const historyView = document.getElementById("history-view");
  const chatView = document.getElementById("chat-view");
  const calendarView = document.getElementById("calendar-view");

  if (!historyView || !chatView || !calendarView) return;

  historyView.classList.remove("active");
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