// chat.js
import { capitalizedName } from "./auth.js";
import { parseAndScheduleTask } from "./tasks.js";
import { startNewConversation, addMessageToCurrentConversation } from "./history.js";
import { showToast } from "./utils.js";

let chatHistory = [];
let isSending = false;

export function initChat() {
  const chatbox = document.getElementById("chatbox");
  const chatForm = document.getElementById("chat-form");
  const userInput = document.getElementById("user-input");
  const btnNuevaConversacion = document.getElementById("btn-nueva-conversacion");

  if (!chatbox || !chatForm || !userInput) return;

  function addMessage(msg, sender, log = true) {
    const d = document.createElement("div");
    d.classList.add(
      "chat-message",
      sender === "ai" ? "ai-message" : "user-message"
    );
    d.innerHTML = `<p>${msg.replace(/\n/g, "<br>")}</p>`;
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
    addMessage(chatHistory[0].parts[0].text, "ai", false);
  }

  // Enviar mensaje al servidor (Gemini)
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const text = userInput.value.trim();
    if (!text || isSending) return;

    addMessage(text, "user");
    chatHistory.push({ role: "user", parts: [{ text }] });
    userInput.value = "";

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

  // Botón "Nueva conversación"
  if (btnNuevaConversacion) {
    btnNuevaConversacion.addEventListener("click", () => {
      nuevaConversacion();
      showToast("Nueva conversación iniciada");
    });
  }

  // Primera conversación al cargar
  nuevaConversacion();
}
