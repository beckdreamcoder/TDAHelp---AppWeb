// --- 1. GUARDIA DE AUTENTICACIÓN ---
const currentUserEmail = localStorage.getItem("currentUser");
if (!currentUserEmail) window.location.href = "index.html";

// --- 2. OBTENER USUARIO ---
const userDatabaseKey = "userDatabase_v3";
const usersArray = JSON.parse(localStorage.getItem(userDatabaseKey)) || [];
const currentUserData = usersArray.find(u => u.email === currentUserEmail);

if (!currentUserData) {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
}

const capitalizedName =
    currentUserData.nombre.charAt(0).toUpperCase() +
    currentUserData.nombre.slice(1);

const TAREAS_KEY = `mis_tareas_${currentUserEmail}`;

// ========================
//   CATEGORÍAS
// ========================
function asignarCategoria(titulo) {
    titulo = titulo.toLowerCase();

    if (titulo.includes("estudi") || titulo.includes("curso") || titulo.includes("tarea"))
        return { categoria: "Educación", color: "#0d6efd" };

    if (titulo.includes("trabajo") || titulo.includes("reunión") || titulo.includes("oficina"))
        return { categoria: "Trabajo", color: "#198754" };

    if (titulo.includes("familia") || titulo.includes("mam") || titulo.includes("pap") || titulo.includes("casa"))
        return { categoria: "Familia", color: "#fd7e14" };

    if (titulo.includes("salud") || titulo.includes("gym") || titulo.includes("ejercicio"))
        return { categoria: "Salud", color: "#dc3545" };

    if (titulo.includes("comprar") || titulo.includes("limpiar") || titulo.includes("rutina"))
        return { categoria: "Rutina", color: "#6f42c1" };

    return { categoria: "General", color: "#0d6efd" };
}

// ========================
// INICIO APP
// ========================
document.addEventListener("DOMContentLoaded", () => {

    // =============================
// NAME FIX: HEADER -> usuario
//            SIDEBAR -> nombre de app
// =============================
document.getElementById("header-username").textContent = `¡Hola ${capitalizedName}!`;
document.getElementById("sidebar-username").textContent = "TDAHelp"; 
    let calendar;
    let allTasks = [];

    // ========================
    // TAREAS
    // ========================
    const cargarTareas = () => {
        const data = localStorage.getItem(TAREAS_KEY);
        if (data) allTasks = JSON.parse(data);
    };

    const guardarTareas = () => {
        localStorage.setItem(TAREAS_KEY, JSON.stringify(allTasks));
    };

    const agregarNuevaTarea = tarea => {
        if (!tarea.id) tarea.id = "task_" + Date.now();

        const { categoria, color } = asignarCategoria(tarea.title);

        tarea.categoria = categoria;
        tarea.backgroundColor = color;
        tarea.borderColor = color;

        allTasks.push(tarea);
        guardarTareas();

        if (calendar) calendar.addEvent(tarea);

        showToast(`Agregado: ${tarea.title} (${categoria})`);
    };

    // ========================
    // PARSEO DE TAREAS
    // ========================
    function parseAndScheduleTask(txt) {
        const regex = /<TASK_SCHEDULE>([\s\S]*?)<\/TASK_SCHEDULE>/g;
        const matches = [...txt.matchAll(regex)];

        let clean = txt;

        matches.forEach(m => {
            try {
                const taskObj = JSON.parse(m[1].trim());
                agregarNuevaTarea(taskObj);
                clean = clean.replace(m[0], "");
            } catch (e) {
                console.error("Error:", e);
            }
        });

        return clean.trim();
    }

    // ========================
    // TOAST
    // ========================
    function showToast(msg) {
        const t = document.getElementById("toast");
        t.textContent = msg;
        t.classList.add("show");
        setTimeout(() => t.classList.remove("show"), 2500);
    }

    // ========================
    // CALENDARIO
    // ========================
    const inicializarCalendario = () => {
        const calendarEl = document.getElementById("calendar");
        if (!calendarEl) return;

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: "timeGridWeek",
            locale: "es",
            height: "auto",
            expandRows: true,

            headerToolbar: {
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay"
            },

            events: allTasks,

            editable: true,

            // ELIMINAR EVENTO
            eventClick(info) {
                const ok = confirm(`¿Eliminar "${info.event.title}"?`);
                if (!ok) return;

                allTasks = allTasks.filter(t => t.id !== info.event.id);
                guardarTareas();

                info.event.remove();
                showToast("Tarea eliminada");
            },

            // MOVER EVENTO
            eventDrop(info) {
                const t = allTasks.find(a => a.id === info.event.id);
                if (t) {
                    t.start = info.event.start.toISOString();
                    t.end = info.event.end?.toISOString() || null;
                    guardarTareas();
                }
            }
        });

        setTimeout(() => {
            calendar.render();
            calendar.updateSize();
        }, 100);
    };

    // ========================
    // CHAT
    // ========================
    const chatbox = document.getElementById("chatbox");
    const chatForm = document.getElementById("chat-form");
    const userInput = document.getElementById("user-input");

    let chatHistory = [
        { role: "model", parts: [{ text: `¡Hola ${capitalizedName}! ¿Qué deseas hacer hoy? 🧠` }] }
    ];

    function addMessage(msg, sender) {
        const d = document.createElement("div");
        d.classList.add("chat-message", sender === "ai" ? "ai-message" : "user-message");
        d.innerHTML = `<p>${msg.replace(/\n/g, "<br>")}</p>`;
        chatbox.appendChild(d);
        chatbox.scrollTop = chatbox.scrollHeight;
    }

    chatForm.addEventListener("submit", async e => {
        e.preventDefault();

        const text = userInput.value.trim();
        if (!text) return;

        addMessage(text, "user");
        chatHistory.push({ role: "user", parts: [{ text }] });

        userInput.value = "";

        const now = new Date().toLocaleString("es-ES");

        const ctx = {
            role: "user",
            parts: [{ text: `(Contexto: Fecha actual ${now})` }]
        };

        const payload = [ctx, ...chatHistory];

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ history: payload })
            });

            const data = await res.json();
            const clean = parseAndScheduleTask(data.reply);

            if (clean) addMessage(clean, "ai");

            chatHistory.push({ role: "model", parts: [{ text: data.reply }] });

        } catch (e) {
            addMessage("Error al conectar con el servidor 😥", "ai");
        }
    });

    // ========================
    // NAVEGACIÓN
    // ========================
    const navChat = document.getElementById("nav-chat");
    const navCalendar = document.getElementById("nav-calendar");
    const navLogout = document.getElementById("nav-logout");

    const chatView = document.getElementById("chat-view");
    const calendarView = document.getElementById("calendar-view");
    const historyView = document.getElementById("history-view");

    navCalendar.addEventListener("click", e => {
        e.preventDefault();

        chatView.classList.remove("active");
        historyView.classList.remove("active");
        calendarView.classList.add("active");

        navChat.classList.remove("active");
        navCalendar.classList.add("active");

        setTimeout(() => {
            calendar.render();
            calendar.updateSize();
        }, 100);
    });

    navChat.addEventListener("click", e => {
        e.preventDefault();

        calendarView.classList.remove("active");
        historyView.classList.remove("active");
        chatView.classList.add("active");

        navCalendar.classList.remove("active");
        navChat.classList.add("active");
    });

    navLogout.addEventListener("click", () => {
        localStorage.removeItem("currentUser");
        window.location.href = "index.html";
    });

    // ========================
    // ARRANQUE
    // ========================
    cargarTareas();
    inicializarCalendario();
    addMessage(chatHistory[0].parts[0].text, "ai");
});
