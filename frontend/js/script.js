/* Chat initialization - only if elements exist */
const input = document.getElementById("userInput");
const btn = document.getElementById("sendBtn");
const messagesDiv = document.getElementById("messages");

if (input && btn && messagesDiv) {
  btn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });
}

function addMessage(text, sender) {
  if (!messagesDiv) return;
  const div = document.createElement("div");
  div.classList.add("msg", sender);
  div.textContent = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendMessage() {
  if (!input || !messagesDiv) return;
  const text = input.value.trim();
  if (!text) return;
  addMessage(text, "user");
  input.value = "";

  addMessage("Escribiendo...", "bot");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    messagesDiv.lastChild.remove(); // eliminar "Escribiendo..."
    addMessage(data.reply, "bot");
  } catch (err) {
    messagesDiv.lastChild.remove();
    addMessage("Error al conectar con el servidor.", "bot");
  }
}

/* Carousel initialization - wait for DOM to be ready */
document.addEventListener('DOMContentLoaded', function() {
  console.log('[CAROUSEL] DOM ready, initializing carousel...');
  
  const carousel = document.getElementById('heroCarousel');
  if (!carousel) {
    console.log('[CAROUSEL] Element heroCarousel not found');
    return;
  }
  
  console.log('[CAROUSEL] Found carousel element');

  const slides = carousel.querySelectorAll('.carousel-slide');
  const prevBtn = carousel.querySelector('.carousel-control.prev');
  const nextBtn = carousel.querySelector('.carousel-control.next');
  const indicators = carousel.querySelectorAll('.indicator');
  let current = 0;
  let intervalId = null;
  const INTERVAL = 5000;

  console.log('[CAROUSEL] Found', slides.length, 'slides');

  function goTo(index) {
    slides[current].classList.remove('active');
    indicators[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    indicators[current].classList.add('active');
    console.log('[CAROUSEL] Changed to slide', current);
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetTimer(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetTimer(); });

  indicators.forEach((btn, idx) => {
    btn.addEventListener('click', () => { goTo(idx); resetTimer(); });
  });

  function startTimer() {
    stopTimer();
    intervalId = setInterval(next, INTERVAL);
    console.log('[CAROUSEL] Auto-rotation started');
  }
  function stopTimer() { if (intervalId) clearInterval(intervalId); }
  function resetTimer() { stopTimer(); startTimer(); }

  carousel.addEventListener('mouseenter', stopTimer);
  carousel.addEventListener('mouseleave', startTimer);

  // Start auto-rotation
  startTimer();
  console.log('[CAROUSEL] Initialization complete');
});
