// chat.js
import { capitalizedName, currentUserEmail } from "./auth.js";
import { parseAndScheduleTask } from "./tasks.js";
import { startNewConversation, addMessageToCurrentConversation } from "./history.js";
import { showToast } from "./utils.js";

let chatHistory = [];
let isSending = false;

const EVENTS_KEY_PREFIX = "task_events_";
const EVENTS_KEY = `${EVENTS_KEY_PREFIX}${currentUserEmail}`;

function ensureEventsInit() {
  if (!localStorage.getItem(EVENTS_KEY)) {
    localStorage.setItem(EVENTS_KEY, JSON.stringify([]));
  }
}

function pushEvent(eventObj) {
  ensureEventsInit();
  const raw = localStorage.getItem(EVENTS_KEY);
  let arr = [];
  try {
    arr = JSON.parse(raw) || [];
  } catch {
    arr = [];
  }
  arr.push(eventObj);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(arr));
}

// Detector simple (frases en español, case-insensitive)
function isCompletionPhrase(text) {
  if (!text || typeof text !== "string") return false;
  const t = text.toLowerCase();

  const positivesTask = [
    "ya terminé", "ya termine", "listo, terminé", "listo terminé",
    "listo termine", "ya lo hice", "lo hice", "finalizado", "finalice",
    "finalicé", "completé", "completé la tarea", "terminado",
    "ya pude terminar", "queda hecho", "ya está hecho", "ya esta hecho", "ya esta listo"
  ];

  const positivesBreak = [
    "ya descansé", "ya descanse", "ya terminé el descanso", "ya termine el descanso",
    "listo el descanso", "listo el break", "ya volví", "ya regrese", "ya regresé"
  ];

  const negatives = ["no terminé", "no termine", "no lo hice", "no pude"];

  for (const n of negatives) {
    if (t.includes(n)) return false;
  }
  for (const p of positivesTask) {
    if (t.includes(p)) return true;
  }
  for (const p of positivesBreak) {
    if (t.includes(p)) return true;
  }

  const words = ["terminé", "termine", "terminado", "completé", "finalicé", "finalizado", "listo"];
  for (const w of words) {
    if (t.includes(w) && !t.includes("no " + w)) return true;
  }

  return false;
}

export function initChat() {
  const chatbox = document.getElementById("chatbox");
  const chatForm = document.getElementById("chat-form");
  const userInput = document.getElementById("user-input");
  const btnNuevaConversacion = document.getElementById("btn-nueva-conversacion");

  if (!chatbox || !chatForm || !userInput) return;

  // 🔥 AQUÍ ESTABA EL ERROR: Actualizamos esta función para pintar el icono 🔥
  function addMessage(msg, sender, log = true) {
    const d = document.createElement("div");
    // Clases base
    d.classList.add(
      "chat-message",
      sender === "ai" ? "ai-message" : "user-message"
    );

    let htmlContent = "";

    // 1. Si es la IA, agregamos el icono del robot primero
    if (sender === "ai") {
        // Asegúrate de que esta ruta sea correcta en tu proyecto
        htmlContent += `<img src="/images/IconoRobot.png" alt="AI" class="chat-avatar">`;
    }

    // 2. Envolvemos el texto en 'message-content' para que tome el color del CSS
    htmlContent += `
        <div class="message-content">
            ${msg.replace(/\n/g, "<br>")}
        </div>
    `;

    d.innerHTML = htmlContent;
    chatbox.appendChild(d);
    chatbox.scrollTop = chatbox.scrollHeight;

    if (log) {
      addMessageToCurrentConversation(sender, msg);
    }
  }

  function nuevaConversacion() {
    startNewConversation();
    chatHistory = [
      {
        role: "model",
        parts: [
          {
            text: `¡Hola ${capitalizedName}! ¿Qué deseas hacer hoy? 🧠`,
          },
        ],
      },
    ];
    chatbox.innerHTML = "";
    // El tercer parámetro 'false' evita que se duplique en el historial al iniciar
    addMessage(chatHistory[0].parts[0].text, "ai", false);
  }

  // Enviar mensaje al servidor
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const text = userInput.value.trim();
    if (!text || isSending) return;

    // Registrar mensaje del usuario en la UI y en history
    addMessage(text, "user");
    chatHistory.push({ role: "user", parts: [{ text }] });
    userInput.value = "";

    // --- Detectar frase de completado ---
    try {
      if (isCompletionPhrase(text)) {
        const ev = {
          id: "evt_" + Date.now() + "_" + Math.random().toString(16).slice(2),
          userId: currentUserEmail,
          text,
          taskId: null,
          timestamp: new Date().toISOString(),
          type: "completed",
          source: "chat_user",
        };
        pushEvent(ev);
        showToast("Tarea registrada como completada ✅");
      }
    } catch (e) {
      console.error("Error registrando evento:", e);
    }

    const now = new Date().toLocaleString("es-ES");
    const ctx = {
      role: "user",
      parts: [{ text: `(Contexto: Fecha actual ${now})` }],
    };

    const payload = [ctx, ...chatHistory];

    try {
      isSending = true;
      userInput.disabled = true;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: payload }),
      });

      const data = await res.json();
      if (data.error) {
        addMessage("Error al conectar con el servidor 😥", "ai");
        return;
      }

      const clean = parseAndScheduleTask(data.reply);
      if (clean) addMessage(clean, "ai");

      chatHistory.push({ role: "model", parts: [{ text: data.reply }] });
    } catch (err) {
      console.error(err);
      addMessage("Error al conectar con el servidor 😥", "ai");
    } finally {
      isSending = false;
      userInput.disabled = false;
      userInput.focus();
    }
  });

  if (btnNuevaConversacion) {
    btnNuevaConversacion.addEventListener("click", () => {
      nuevaConversacion();
      showToast("Nueva conversación iniciada");
    });
  }

  // Cargar si es la primera vez
  // OJO: Si ya vienes de "Retomar" historial, tal vez no quieras limpiar el chat.
  // Pero como tu lógica actual de 'Retomar' maneja la vista por separado, esto está bien
  // para cuando recargas la página completamente.
  if (!chatbox.innerHTML.trim()) {
      nuevaConversacion();
  }
}