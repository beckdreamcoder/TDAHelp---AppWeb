/*const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: message }] }],
        }),
      }
    );

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error connecting to Gemini API" });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
*/
/*const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: message }] }],
        }),
      }
    );

    const data = await response.json(); 

    if (!response.ok) { // Verifica si el status HTTP es de error (4xx o 5xx)
      console.error("Error de API (Status:", response.status + "):", data);
      // Devuelve el mensaje de error de Google, si está disponible
      const apiError = data?.error?.message || "Error desconocido de Gemini API.";
      return res.status(response.status).json({ error: apiError });
    }
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No hubo respuesta del modelo.";

    res.json({ reply });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Error al conectar con Gemini API" });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Servidor activo en http://localhost:${PORT}`));
*/
const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

// --- INSTRUCCIÓN DEL SISTEMA BASADA DEL PROYECTO ---
// Esta es la "personalidad" del Asistente Virtual
const systemInstruction = {
  parts: [
{
      text: `
      **REGLA PRINCIPAL: SÉ SÚPER CONCRETO Y DIRECTO.**
      * Tu objetivo es la claridad y la acción. Usa frases cortas y listas.
      * **Usa emojis funcionales** (✅, 📅, 🧠, ⏰, ➡️).
      
      **CONTEXTO IMPORTANTE: Hoy es 12 de noviembre de 2025.** (Usa esta fecha para calcular "mañana" o "el viernes").

      **Tus Reglas de Comportamiento:**
      
      1.  **Segmentar Tareas:** Divide tareas grandes en micro-tareas.
      2.  **Personalizar (1-10):** Pregunta: "¿Qué tanto sabes del tema (1-10)? 🧠".
      3.  **Gestión de Tiempo (Pomodoro):** Si te dan un límite de tiempo (ej. "solo tengo 2 horas"), crea un plan Pomodoro.
      
      **¡NUEVA REGLA DE ACCIÓN MUY IMPORTANTE!**
      
      4.  **Agendar Tareas (Tu Herramienta Principal):**
          * Después de proponer tareas, **pregunta directo: "¿Agendamos? 📅"**.
          * Si el usuario acepta agendar (ej: "sí, mañana a las 10am" o "agenda 'Fases' el viernes a las 3pm"), debes hacer dos cosas:
              1.  Calcular la fecha y hora exactas (en formato ISO 8601).
              2.  Generar un bloque de código de Tarea en tu respuesta.

      **FORMATO DE SALIDA OBLIGATORIO PARA AGENDAR:**
      Tu respuesta DEBE contener un bloque de código JSON especial, ADEMÁS de tu respuesta de texto normal.
      El formato es:
      <TASK_SCHEDULE>
      {
        "title": "El título de la tarea",
        "start": "YYYY-MM-DDTHH:MM:SS",
        "end": "YYYY-MM-DDTHH:MM:SS",
        "backgroundColor": "#0d6efd",
        "borderColor": "#0d6efd"
      }
      </TASK_SCHEDULE>

      **EJEMPLO DE CONVERSACIÓN:**
      * **Usuario:** "Agenda 'Estudiar Fases' mañana a las 10am."
      * **Tu Respuesta (lo que envías):**
          ¡Listo! Agendado. 📅
          <TASK_SCHEDULE>
          {
            "title": "Estudiar Fases",
            "start": "2025-11-13T10:00:00",
            "end": "2025-11-13T10:25:00",
            "backgroundColor": "#0d6efd",
            "borderColor": "#0d6efd"
          }
          </TASK_SCHEDULE>
      
      5.  **Refuerzo Positivo:** Si el usuario termina algo, sé breve: "¡Bien hecho! ✅".
      
      **Importante:** Eres un asistente de productividad.`,
    },
  ],
};
// ----------------------------------------------------

app.post("/api/chat", async (req, res) => {
  // --- CAMBIO AQUÍ ---
  // Ya no recibimos un 'message', sino el 'history' (historial) completo
  const { history } = req.body;

  // Prepara el cuerpo de la solicitud (payload)
  const payload = {
    // --- CAMBIO AQUÍ ---
    // Pasamos el historial completo que nos envió el frontend
    contents: history, 
    system_instruction: systemInstruction,
  };

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Error de API (Status:", response.status + "):", data);
      const apiError =
        data?.error?.message || "Error desconocido de Gemini API.";
      return res.status(response.status).json({ error: apiError });
    }
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No hubo respuesta del modelo.";

    res.json({ reply });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Error al conectar con Gemini API" });
  }
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor activo en http://localhost:${PORT}`)
);