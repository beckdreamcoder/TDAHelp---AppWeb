const path = require('path');
const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(express.json());
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// --- INSTRUCCIÓN DEL SISTEMA BASADA DEL PROYECTO ---
// Esta es la "personalidad" del Asistente Virtual
// ¡CORRECCIÓN! Se eliminó la fecha hard-codeada de aquí.
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

      **EJEMPLO DE CONVERSACIÓN (¡La fecha es solo un ejemplo!):**
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
  // Ya no recibimos un 'message', sino el 'history' (historial) completo
  const { history } = req.body;

  // --- ¡NUEVA LÓGICA DE FECHA DINÁMICA! ---
  // Obtenemos la fecha actual real en la zona horaria correcta (Ej: 'America/Lima')
  // Ajusta 'America/Lima' a tu zona horaria si es necesario.
  const hoy = new Date().toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/Lima' 
  });
  
  // Creamos el contexto de fecha que se inyectará a la IA
  const dateContext = `**CONTEXTO IMPORTANTE: La fecha de hoy es ${hoy}.** (Usa esta fecha para todos los cálculos de "mañana", "próximo lunes", etc.)`;
  
  // Clonamos la instrucción del sistema para esta petición (para no modificar la original)
  const dynamicSystemInstruction = JSON.parse(JSON.stringify(systemInstruction));
  
  // Inyectamos el contexto de la fecha al principio del texto de la instrucción
  dynamicSystemInstruction.parts[0].text = dateContext + '\n\n' + dynamicSystemInstruction.parts[0].text;
  // --- FIN DE LA NUEVA LÓGICA ---


  // Prepara el cuerpo de la solicitud (payload)
  const payload = {
    // Pasamos el historial completo que nos envió el frontend
    contents: history, 
    // ¡CORRECCIÓN! Usamos la instrucción dinámica con la fecha real
    system_instruction: dynamicSystemInstruction,
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