// auth.js
const userDatabaseKey = "userDatabase_v3";

export const currentUserEmail = localStorage.getItem("currentUser");

if (!currentUserEmail) {
  window.location.href = "index.html";
}

const usersArray = JSON.parse(localStorage.getItem(userDatabaseKey)) || [];
const currentUserData = usersArray.find((u) => u.email === currentUserEmail);

if (!currentUserData) {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

export const capitalizedName =
  currentUserData.nombre.charAt(0).toUpperCase() +
  currentUserData.nombre.slice(1);

export const TAREAS_KEY = `mis_tareas_${currentUserEmail}`;
export const CONVERSATIONS_KEY = `tdah_conversations_${currentUserEmail}`;

export function initAuthHeader() {
  const header = document.getElementById("header-username");
  const sidebar = document.getElementById("sidebar-username");
  if (header) header.textContent = `¡Hola ${capitalizedName}!`;
  if (sidebar) sidebar.textContent = "TDAHelp";
}

export function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}
