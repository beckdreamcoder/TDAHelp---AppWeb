// /js/auth.js

const currentUserEmail = localStorage.getItem("currentUser");
if (!currentUserEmail) {
  window.location.href = "index.html";
}

const userDatabaseKey = "userDatabase_v3";
const usersArray = JSON.parse(localStorage.getItem(userDatabaseKey)) || [];
const currentUserData = usersArray.find((u) => u.email === currentUserEmail);

if (!currentUserData) {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

const capitalizedName =
  currentUserData.nombre.charAt(0).toUpperCase() +
  currentUserData.nombre.slice(1);

const TAREAS_KEY = `mis_tareas_${currentUserEmail}`;
const CONVERSATIONS_KEY = `tdah_conversations_${currentUserEmail}`;

function setupHeaderAndSidebar() {
  const headerUsername = document.getElementById("header-username");
  const sidebarUsername = document.getElementById("sidebar-username");

  if (headerUsername) {
    headerUsername.textContent = `¡Hola ${capitalizedName}!`;
  }
  if (sidebarUsername) {
    sidebarUsername.textContent = "TDAHelp";
  }
}

export {
  currentUserEmail,
  currentUserData,
  capitalizedName,
  TAREAS_KEY,
  CONVERSATIONS_KEY,
  setupHeaderAndSidebar,
};
