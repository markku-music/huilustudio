function updateAppHeight() {
  const v = window.visualViewport;
  const w = v?.width || window.innerWidth;
  const h = v?.height || window.innerHeight;
  const isLandscape = window.matchMedia("(orientation: landscape)").matches;

  // iPadOS PWA -käynnistysbugi: iOS antaa PWA-tilassa pystyasennon mitat 
  // käynnistyksen yhteydessä vaikka laite olisi vaakatasossa.
  // Vaakatasossa korkeus on AINA pienempi kahdesta mitasta, pystytasossa suurempi.
  const realHeight = isLandscape ? Math.min(w, h) : Math.max(w, h);

  document.documentElement.style.setProperty("--app-height", `${Math.round(realHeight)}px`);
}

function markViewportReady() {
  document.documentElement.classList.remove("viewport-pending");
  document.documentElement.classList.add("viewport-ready");
}

function stabilizeViewport() {
  updateAppHeight();
  requestAnimationFrame(updateAppHeight);
  setTimeout(updateAppHeight, 80);
  setTimeout(updateAppHeight, 250);
}

function bootViewport() {
  updateAppHeight();
  markViewportReady();
  requestAnimationFrame(stabilizeViewport);
}

window.addEventListener("resize", stabilizeViewport, { passive: true });
window.addEventListener("orientationchange", stabilizeViewport, { passive: true });

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", stabilizeViewport, { passive: true });
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) stabilizeViewport();
});

window.addEventListener("pageshow", stabilizeViewport);

bootViewport();

const notes = ["C", "C♯", "D♭", "D", "D♯", "E♭", "E", "F", "F♯", "G♭", "G", "G♯", "A♭", "A", "A♯", "B♭", "B"];

const noteEl = document.getElementById("note");
const cardEl = document.getElementById("card");
const newNoteBtn = document.getElementById("newNote");

let previous = noteEl.textContent;

function randomNote() {
  let next = previous;
  while (next === previous && notes.length > 1) {
    next = notes[Math.floor(Math.random() * notes.length)];
  }
  previous = next;
  noteEl.textContent = next;

  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
}

cardEl.addEventListener("click", randomNote);
newNoteBtn.addEventListener("click", randomNote);

cardEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    randomNote();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}