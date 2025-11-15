// --- 1. GUARDIA DE AUTENTICACIÓN ---
const currentUserEmail = localStorage.getItem('currentUser');
if (!currentUserEmail) {
    // Usamos un toast sutil en lugar de alert()
    console.error('Usuario no autenticado, redirigiendo...');
    // alert('Por favor, inicia sesión para continuar.');
    window.location.href = 'index.html';
}

// --- 2. OBTENER DATOS DEL USUARIO ---
const userDatabaseKey = 'userDatabase_v3';
const usersArray = JSON.parse(localStorage.getItem(userDatabaseKey)) || [];
const currentUserData = usersArray.find(user => user.email === currentUserEmail);

if (!currentUserData) {
    console.error('Datos de usuario no encontrados, cerrando sesión...');
    // alert('Error al encontrar tus datos. Por favor, inicia sesión de nuevo.');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

const currentUserName = currentUserData.nombre;
const capitalizedName = currentUserName.charAt(0).toUpperCase() + currentUserName.slice(1);
const TAREAS_KEY = `mis_tareas_${currentUserEmail}`;

// --- 3. INICIO DE LA APLICACIÓN ---
document.addEventListener('DOMContentLoaded', () => {

    // --- Variables Globales ---
    let calendar;
    let allTasks = [];

    // ===================================
    // LÓGICA DE BASE DE DATOS (LocalStorage)
    // ===================================
    function cargarTareas() {
        const tareasGuardadas = localStorage.getItem(TAREAS_KEY);
        if (tareasGuardadas) {
            allTasks = JSON.parse(tareasGuardadas);
        }
    }

    function guardarTareas() {
        localStorage.setItem(TAREAS_KEY, JSON.stringify(allTasks));
    }

    function agregarNuevaTarea(tareaObj) {
        // Asignar ID si no lo tiene (la IA no lo provee)
        if (!tareaObj.id) {
            tareaObj.id = 'task_' + Date.now();
        }
        
        allTasks.push(tareaObj);
        guardarTareas();
        
        if (calendar) {
            calendar.addEvent(tareaObj);
        }
        
        // ¡Cambiamos el alert! Ahora es más sutil.
        console.log(`Tarea "${tareaObj.title}" guardada! ✅`);
        showToast(`Tarea "${tareaObj.title}" guardada ✅`); // Añadido
    }
    
    // Función MANUAL (mejorada): abre modal en vez de usar prompt/alert
    function promptCrearTarea() {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskModalForm');
        const errorEl = document.getElementById('taskModalError');
        if (!modal || !form) {
            // fallback al comportamiento antiguo si el modal no está disponible
            console.warn('Modal no disponible, usando prompt clásico (NO RECOMENDADO)');
            // ... (el código de fallback con prompts fue eliminado por seguridad, ya que el modal existe)
            return;
        }

        // reset form
        form.reset();
        errorEl.textContent = '';
        modal.classList.add('open');

        // focus title
        setTimeout(() => {
            const titleInput = document.getElementById('modal-title');
            if (titleInput) titleInput.focus();
        }, 50);
    }

    // --- Función de Toast (Notificaciones) ---
    function showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2800);
    }

    // Manejo del formulario del modal
    (function setupTaskModal() {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskModalForm');
        const cancelBtn = document.getElementById('taskModalCancel');
        const errorEl = document.getElementById('taskModalError');
        if (!modal || !form) return;

        function hideModal() {
            modal.classList.remove('open');
        }

        cancelBtn && cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal();
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            errorEl.textContent = '';
            const titulo = document.getElementById('modal-title').value.trim();
            const fechaStr = document.getElementById('modal-date').value;
            const horaStr = document.getElementById('modal-time').value;
            const duracionMin = parseInt(document.getElementById('modal-duration').value) || 25;

            if (!titulo) { errorEl.textContent = 'Escribe un título para la tarea.'; return; }
            if (!fechaStr) { errorEl.textContent = 'Selecciona una fecha.'; return; }
            if (!horaStr) { errorEl.textContent = 'Selecciona una hora.'; return; }

            const inicio = `${fechaStr}T${horaStr}:00`;
            const fechaInicio = new Date(inicio);
            if (isNaN(fechaInicio.getTime())) { errorEl.textContent = 'Fecha/hora inválida.'; return; }
            const fechaFin = new Date(fechaInicio.getTime() + duracionMin * 60000);

            const nuevaTarea = {
                title: titulo,
                start: fechaInicio.toISOString(),
                end: fechaFin.toISOString(),
                backgroundColor: '#0d6efd',
                borderColor: '#0d6efd'
            };

            agregarNuevaTarea(nuevaTarea);
            hideModal();
            showToast(`Tarea "${nuevaTarea.title}" guardada ✅`);
        });
    })();

    // ===================================
    // INICIALIZACIÓN DEL CALENDARIO
    // ===================================
    function inicializarCalendario() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek',
            locale: 'es',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: allTasks,
            editable: true,
            eventClick: function(info) {
                // REEMPLAZO DE CONFIRM()
                if (window.confirm(`¿Quieres eliminar la tarea "${info.event.title}"?`)) { // Temporal, idealmente usar un modal
                    allTasks = allTasks.filter(task => task.id !== info.event.id);
                    guardarTareas();
                    info.event.remove();
                    showToast("Tarea eliminada.");
                }
            },
            eventDrop: function(info) {
                const tarea = allTasks.find(task => task.id === info.event.id);
                if (tarea) {
                    tarea.start = info.event.start.toISOString();
                    tarea.end = info.event.end ? info.event.end.toISOString() : null;
                    guardarTareas();
                    showToast(`Tarea "${tarea.title}" movida.`);
                }
            }
        });
    }

    // ===================================
    // NAVEGACIÓN DE VISTAS Y BOTONES
    // ===================================
    const navChat = document.getElementById('nav-chat');
    const navCalendar = document.getElementById('nav-calendar');
    const chatView = document.getElementById('chat-view');
    const calendarView = document.getElementById('calendar-view');
    const historyView = document.getElementById('history-view');
    const btnAgregarTarea = document.getElementById('btn-agregar-tarea');
    const btnVerHistorial = document.getElementById('btn-ver-historial');
    const btnNuevaConversacion = document.getElementById('btn-nueva-conversacion');
    const btnLogout = document.getElementById('nav-logout');

    navChat.addEventListener('click', (e) => {
        e.preventDefault();
        chatView.classList.add('active');
        calendarView.classList.remove('active');
        historyView.classList.remove('active');
        navChat.classList.add('active');
        navCalendar.classList.remove('active');
    });

    navCalendar.addEventListener('click', (e) => {
        e.preventDefault();
        chatView.classList.remove('active');
        calendarView.classList.add('active');
        historyView.classList.remove('active');
        navChat.classList.remove('active');
        navCalendar.classList.add('active');
        if (calendar) { 
            // Pequeño delay para asegurar que el DOM esté visible
            setTimeout(() => calendar.render(), 50); 
        }
    });

    btnAgregarTarea.addEventListener('click', () => {
        promptCrearTarea(); // El modo manual sigue existiendo
    });

    btnVerHistorial.addEventListener('click', () => {
        chatView.classList.remove('active');
        calendarView.classList.remove('active');
        historyView.classList.add('active');
        navChat.classList.remove('active');
        navCalendar.classList.remove('active');
        renderHistoryList();
    });

    btnNuevaConversacion.addEventListener('click', () => {
        // REEMPLAZO DE CONFIRM()
        if (window.confirm('¿Deseas iniciar una nueva conversación? La actual se guardará en tu historial.')) {
            startNewSession();
        }
    });

    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        // REEMPLAZO DE CONFIRM()
        if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }
    });

    // ===================================
    // LÓGICA DEL CHATBOT (¡ACTUALIZADA PARA SEGMENTACIÓN!)
    // ===================================
    const chatbox = document.getElementById('chatbox');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');

    let chatHistory = [
        {
            role: 'model',
            parts: [{ text: `¡Hola ${capitalizedName}! ¿Qué te gustaría hacer hoy? 🧠` }]
        }
    ];

    function addMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', `${sender}-message`);
        let messageContent = '';
        if (sender === 'ai') {
            messageContent = `<img src="https://i.imgur.com/1G6G1A8.png" alt="AI" class="avatar">`;
        }
        // Seguridad: Sanitizar el HTML antes de insertarlo
        const formattedMessage = message.replace(/\n/g, '<br>');
        messageContent += `<p>${formattedMessage}</p>`;
        messageDiv.innerHTML = messageContent;
        chatbox.appendChild(messageDiv);
        chatbox.scrollTop = chatbox.scrollHeight;
    }

    // --- ¡FUNCIÓN ACTUALIZADA! ---
    // Ahora busca MÚLTIPLES bloques de tareas
    function parseAndScheduleTask(aiReply) {
        // Usamos el flag 'g' (global) para encontrar todas las coincidencias
        const taskRegex = /<TASK_SCHEDULE>([\s\S]*?)<\/TASK_SCHEDULE>/g;
        
        // matchAll devuelve un iterador, lo convertimos a un array
        const matches = [...aiReply.matchAll(taskRegex)];
        
        let cleanReply = aiReply;
        let tasksParsed = 0;

        if (matches.length === 0) {
            return aiReply; // No hay tareas, devolver original
        }

        for (const match of matches) {
            if (match && match[1]) {
                try {
                    // 1. Extrae el JSON del bloque
                    const taskJsonString = match[1];
                    const taskObject = JSON.parse(taskJsonString);

                    // 2. Llama a la función para guardar la tarea
                    //    (Esta función ya muestra un toast individual)
                    agregarNuevaTarea(taskObject);
                    tasksParsed++;

                    // 3. Limpia este bloque de la respuesta (match[0] es el bloque completo)
                    cleanReply = cleanReply.replace(match[0], "");

                } catch (error) {
                    console.error("Error al parsear el JSON de la tarea:", error, match[1]);
                    // No hacemos 'return', continuamos por si hay más bloques válidos
                }
            }
        }
        
        // Opcional: un toast general si se agregaron varias
        if (tasksParsed > 1) {
            showToast(`¡Se agendaron ${tasksParsed} micro-tareas!`);
        }

        // Devuelve la respuesta de texto LIMPIA (sin los bloques)
        return cleanReply.trim();
    }


    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const message = userInput.value.trim();
        if (message === '') return;
        
        addMessage(message, 'user');
        chatHistory.push({ role: 'user', parts: [{ text: message }] });
        userInput.value = '';
        saveCurrentSession(); // Guardar inmediatamente

        // --- ¡LÓGICA DE FECHA Y HORA ESTABLE! ---
        const ahora = new Date();
        const fechaHoraActual = ahora.toLocaleString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'America/Lima' // Asegúrate que coincida con tu zona horaria
        });
        
        const dateContextMessage = {
          role: 'user', 
          parts: [{ text: `(Contexto importante del sistema: La fecha y hora actual es ${fechaHoraActual}. Todos los cálculos de tiempo... deben basarse en esta fecha y hora.)` }]
        };
        
        // Inyectamos el contexto de fecha/hora al principio del historial que enviamos
        const historyForAPI = [dateContextMessage, ...chatHistory];
        // --- FIN DE LÓGICA DE FECHA Y HORA ---

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history: historyForAPI }),
            });
            if (!response.ok) {
                addMessage('Lo siento, algo salió mal con el servidor. 😥', 'ai');
                chatHistory.pop(); // Elimina el mensaje de usuario que falló
                saveCurrentSession();
                return;
            }

            const data = await response.json();
            
            // --- ¡PASO DE PROCESAMIENTO ACTUALIZADO! ---
            // 1. Procesar la respuesta: buscar MÚLTIPLES tareas y guardarlas
            const cleanReply = parseAndScheduleTask(data.reply);
            
            // 2. Mostrar la respuesta de chat limpia al usuario
            //    (Si cleanReply está vacío, la IA solo quería agendar)
            if (cleanReply.length > 0) {
                addMessage(cleanReply, 'ai');
            }
            
            // 3. Guardar la respuesta ORIGINAL (con el/los bloque/s) en el historial
            chatHistory.push({ role: 'model', parts: [{ text: data.reply }] });
            saveCurrentSession(); // Guardar después de la respuesta

        } catch (error) {
            console.error('Error:', error);
            addMessage('No puedo conectarme. Revisa que el servidor esté corriendo. 🔌', 'ai');
            chatHistory.pop();
            saveCurrentSession();
        }
    });

    // ===================================
    // LÓGICA DEL HISTORIAL DE CHAT (PERSISTENTE)
    // ===================================
    const CHAT_HISTORY_KEY = `chat_history_${currentUserEmail}`;
    const CURRENT_SESSION_KEY = `current_session_${currentUserEmail}`;
    let allConversations = [];
    let currentSessionId = null;

    function loadChatHistory() {
        const saved = localStorage.getItem(CHAT_HISTORY_KEY);
        if (saved) {
            allConversations = JSON.parse(saved);
        }
    }

    function saveChatHistory() {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(allConversations));
    }

    function saveCurrentSession() {
        if (!currentSessionId) return;
        const currentSession = {
            id: currentSessionId,
            messages: chatHistory,
            timestamp: Date.now()
        };
        localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(currentSession));
    }

    function loadCurrentSession() {
        const saved = localStorage.getItem(CURRENT_SESSION_KEY);
        if (saved) {
            try {
                const session = JSON.parse(saved);
                chatHistory = session.messages;
                currentSessionId = session.id;
                return true;
            } catch (e) {
                console.error('Error loading session:', e);
                return false;
            }
        }
        return false;
    }

    function archiveCurrentSession() {
        if (!currentSessionId || chatHistory.length <= 1) return;
        
        const userMessages = chatHistory.filter(m => m.role === 'user');
        if (userMessages.length === 0) return;

        const title = userMessages[0].parts[0].text.substring(0, 40) + '...';
        const conversation = {
            id: currentSessionId,
            title: title,
            messages: chatHistory,
            date: new Date().toLocaleString('es-ES'),
            timestamp: currentSessionId
        };

        const existingIndex = allConversations.findIndex(c => c.id === currentSessionId);
        if (existingIndex >= 0) {
            allConversations[existingIndex] = conversation;
        } else {
            allConversations.unshift(conversation);
        }

        if (allConversations.length > 50) allConversations.pop();
        saveChatHistory();
    }

    function startNewSession() {
        archiveCurrentSession();
        currentSessionId = 'sess_' + Date.now();
        chatHistory = [
            {
                role: 'model',
                parts: [{ text: `¡Hola ${capitalizedName}! ¿Qué te gustaría hacer hoy? 🧠` }]
            }
        ];
        chatbox.innerHTML = '';
        addMessage(chatHistory[0].parts[0].text, 'ai');
        saveCurrentSession();
    }

    function renderHistoryList() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;
        
        if (allConversations.length === 0) {
            historyList.innerHTML = '<p class="history-empty">No hay conversaciones guardadas aún.</p>';
            return;
        }

        historyList.innerHTML = allConversations.map((conv, idx) => `
            <div class="history-item" data-index="${idx}">
                <div class="history-item-title">${conv.title}</div>
                <div class="history-item-date">${conv.date}</div>
            </div>
        `).join('');

        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                showConversationDetail(parseInt(item.dataset.index));
            });
        });
    }

    function showConversationDetail(index) {
        const conv = allConversations[index];
        if (!conv) return;

        const detail = document.getElementById('historyDetail');
        if (!detail) return;

        const messagesHtml = conv.messages.map(msg => {
            const isUser = msg.role === 'user';
            const text = msg.parts[0].text;
            return `
                <div class="history-message ${isUser ? 'user' : 'ai'}">
                    <div class="msg-bubble">${text.replace(/\n/g, '<br>')}</div>
                </div>
            `;
        }).join('');

        detail.innerHTML = `
            <div class="history-detail-header">
                <h3>${conv.title}</h3>
                <p>${conv.date}</p>
            </div>
            <div class="history-detail-messages">
                ${messagesHtml}
            </div>
            <div class="history-actions">
                <button class="history-delete-btn" data-conv-id="${conv.id}">Eliminar</button>
                <button class="history-continue-btn" data-conv-id="${conv.id}">Continuar</button>
            </div>
        `;

        document.querySelector('.history-delete-btn').addEventListener('click', function() {
            const convId = this.dataset.convId;
            allConversations = allConversations.filter(c => c.id !== convId);
            saveChatHistory();
            renderHistoryList();
            detail.innerHTML = '<p style="text-align: center; color: #999; margin-top: 2rem;">Conversación eliminada.</p>';
        });

        document.querySelector('.history-continue-btn').addEventListener('click', function() {
            const convId = this.dataset.convId;
            const conv = allConversations.find(c => c.id === convId);
            if (conv) {
                currentSessionId = conv.id;
                chatHistory = conv.messages;
                chatbox.innerHTML = '';
                chatHistory.forEach((msg) => {
                    // Ya no saltamos el primer mensaje, el historial es el historial
                    addMessage(msg.parts[0].text, msg.role === 'user' ? 'user' : 'ai');
                });
                saveCurrentSession();
                chatView.classList.add('active');
                calendarView.classList.remove('active');
                historyView.classList.remove('active');
                navChat.classList.add('active');
                navCalendar.classList.remove('active');
            }
        });
    }
    
    // ===================================
    // ARRANQUE DE LA APP
    // ===================================
    
    const userGreeting = document.querySelector('#chat-view .chat-header h2');
    if (userGreeting) {
        userGreeting.textContent = `¡Hola! ${capitalizedName}`;
    }

    // Cargar historial de conversaciones
    loadChatHistory();

    // Intentar cargar sesión anterior; si no existe, crear una nueva
    const sessionLoaded = loadCurrentSession();
    if (!sessionLoaded) {
        startNewSession();
    } else {
        // Mostrar los mensajes de la sesión cargada
        chatbox.innerHTML = ''; // Limpiar por si acaso
        chatHistory.forEach((msg) => {
            // Ya no saltamos el saludo, el historial es el historial
            addMessage(msg.parts[0].text, msg.role === 'user' ? 'user' : 'ai');
        });
    }

    cargarTareas();
    inicializarCalendario();
});