// utils.js

// Selectores rápidos
export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => document.querySelectorAll(selector);

// -----------------------------------------------------
// TOAST MODERNO
// -----------------------------------------------------
export function showToast(message, options = {}) {
  const t = document.getElementById("toast");
  if (!t) return;

  // Texto del toast
  t.textContent = message;

  // Tipo visual (opcional)
  const type = options.type || "default"; // success | loading | error

  // Limpia clases anteriores
  t.className = "toast";

  // Aplica clase según tipo
  t.classList.add(`toast-${type}`);

  // Muestra el toast con animación
  t.classList.add("show");

  // Duración del toast
  const duration = options.duration || 2500;

  setTimeout(() => {
    t.classList.remove("show");
  }, duration);
}

// -----------------------------------------------------
// FORMATEAR FECHAS
// -----------------------------------------------------
export function formatDateTimeEs(isoString, withTime = true) {
  const date = new Date(isoString);
  return date.toLocaleString(
    "es-ES",
    withTime
      ? { dateStyle: "short", timeStyle: "short" }
      : { dateStyle: "short" }
  );
}
