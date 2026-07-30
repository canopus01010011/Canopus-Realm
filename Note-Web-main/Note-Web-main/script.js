const addBtn = document.getElementById("add-btn");
const noteInput = document.getElementById("note-input");
const notesContainer = document.getElementById("notes-container");

function loadNotes() {
  const notes = JSON.parse(localStorage.getItem("notes")) || [];
  notesContainer.innerHTML = "";
  notes.forEach((note, index) => {
    const noteCard = document.createElement("div");
    noteCard.className = "note-card";
    noteCard.innerHTML = `
      <p>${note}</p>
      <button class="delete-btn" onclick="deleteNote(${index})">×</button>
    `;
    notesContainer.appendChild(noteCard);
  });
}

function addNote() {
  const noteText = noteInput.value.trim();
  if (noteText === "") return;

  const notes = JSON.parse(localStorage.getItem("notes")) || [];
  notes.push(noteText);
  localStorage.setItem("notes", JSON.stringify(notes));
  noteInput.value = "";
  loadNotes();
}

function deleteNote(index) {
  const notes = JSON.parse(localStorage.getItem("notes")) || [];
  notes.splice(index, 1);
  localStorage.setItem("notes", JSON.stringify(notes));
  loadNotes();
}

addBtn.addEventListener("click", addNote);
window.addEventListener("load", loadNotes);
