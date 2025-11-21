// /js/chat.js

import { capitalizedName } from "./auth.js";
import { parseAndScheduleTask } from "./tasks.js";
import {
  createNewConversation,
  logMessageToConversation,
} from "./history.js";

let chatbox;
let chatForm;
let userInput;

let chatHistory = [];
let isSending = false;

function addMessage(msg, sender, logToHistory = true) {
  if (!chatbox) return;

  const d = document.createElement("div");
  d.classList.add(
    "chat-message",
    sender === "ai" ? "ai-message" : "user-message"
  );
  d.innerHTML = `<p>${msg.replace(/\n/g, "<br>")}</p>`;
  chatbox.appendChild(d);

  // Scroll automático
  chatbox.scrollTop = chatbox.scrollHeight;

  if (logToHistory) {
    logMessageToConversation(sender, msg);
  }
}

function startNewConversation() {
  createNewConversation();

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

  if (chatbox) {
    chatbox.innerHTML = "";
    addMessage(chatHistory[0].parts[0].text, "ai");
  }
}

function initChat() {
  chatbox = document.getElementById("chatbox");
  chatForm = document.getElementById("chat-form");
  userInput = document.getElementById("user-input");

  if (!chatForm || !userInput || !chatbox) return;

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
    } catch (e) {
      console.error(e);
      addMessage("Error al conectar con el servidor 😥", "ai");
    } finally {
      isSending = false;
      userInput.disabled = false;
      userInput.focus();
    }
  });
}

export { initChat, startNewConversation };
