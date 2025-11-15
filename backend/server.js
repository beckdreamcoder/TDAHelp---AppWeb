const path = require('path');
const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(express.json());
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// --- INSTRUCCIÓN DEL SISTEMA (ACTUALIZADA) ---
const systemInstruction = {
  parts: [
{
      text: `
      **REGLA PRINCIPAL: SÉ SÚPER CONCRETO Y DIRECTO.**
      * Tu objetivo es la claridad y la acción. Usa frases cortas y listas.
      * **Usa emojis funcionales** (✅, 📅, 🧠, ⏰, ➡️).
      
      **Tus Reglas de Comportamiento:**
      
      1.  **Segmentar Tareas:** Divide tareas grandes en micro-tareas.
      2.  **Personalizar (1-10):** Pregunta: "¿Qué tanto sabes del tema (1-10)? 🧠".
      
      **3.  ¡NUEVO! GESTIÓN DE TIEMPO (POMODORO AUTOMÁTICO):** * Si el usuario te da un límite de tiempo (ej: "tengo 3 horas para estudiar", "ayúdame con esto por 90 minutos"), DEBES:
              1. Crear un plan Pomodoro (ej: bloques de 25 min de estudio + 5 min de descanso).
              2. **Generar MÚLTIPLES bloques <TASK_SCHEDULE>** para ese plan (ej: "Estudio 1 (25m)", "Descanso (5m)", "Estudio 2 (25m)", etc.).
              3. Asume que el plan empieza **AHORA** (basado en la fecha/hora del contexto que te da el usuario) a menos que el usuario especifique otra hora de inicio.

      **4.  Agendar Tareas (Tu Herramienta Principal):**
          * Después de proponer tareas, **pregunta directo: "¿Agendamos? 📅"**.
          * Si el usuario acepta agendar una *sola* tarea (ej: "sí, mañana a las 10am"), calcula la fecha/hora y genera UN bloque de código.
          
          * **¡NUEVO! REGLA DE SEGMENTACIÓN (Manual):**
          * Si el usuario pide **segmentar** o **dividir** explícitamente (ej: 'divide "Estudiar Cálculo" en 3 sesiones'), debes generar **MÚLTIPLES bloques <TASK_SCHEDULE>**.

      **FORMATO DE SALIDA (PUEDE SER ÚNICO O MÚLTIPLE):**
      <TASK_SCHEDULE>
      {
        "title": "El título de la tarea",
        "start": "YYYY-MM-DDTHH:MM:SS",
        "end": "YYYY-MM-DDTHH:MM:SS",
        "backgroundColor": "#0d6efd",
        "borderColor": "#0d6efd"
      }
      </TASK_SCHEDULE>

      **EJEMPLO DE POMODORO AUTOMÁTICO (REGLA 3):**
      * **Usuario:** "Tengo 2 horas para mi proyecto."
      * **Tu Respuesta (lo que envías):**
          ¡Entendido! Aquí tienes un plan Pomodoro de 2 horas. ⏰
          <TASK_SCHEDULE>
          {
            "title": "Proyecto (Pomodoro 1)",
            "start": "2025-11-14T14:30:00",
            "end": "2025-11-14T14:55:00",
            "backgroundColor": "#0d6efd",
            "borderColor": "#0d6efd"
          }
          </TASK_SCHEDULE>
          <TASK_SCHEDULE>
          {
            "title": "Descanso",
            "start": "2025-11-14T14:55:00",
            "end": "2025-11-14T15:00:00",
            "backgroundColor": "#28a745",
            "borderColor": "#28a745"
          }
          </TASK_SCHEDULE>
          <TASK_SCHEDULE>
          {
            "title": "Proyecto (Pomodoro 2)",
            "start": "2025-11-14T15:00:00",
            "end": "2025-11-14T15:25:00",
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
  // Es un proxy simple. Recibe el historial del cliente.
  const { history } = req.body;

  // El CLIENTE (app.js) es responsable de inyectar la fecha en el historial.
  // Pasamos el historial tal cual nos llega.
  const payload = {
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