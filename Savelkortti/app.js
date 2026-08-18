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
