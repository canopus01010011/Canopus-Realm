
const songs = [
  { file: "Epic The Musical_01_The Horse and the Infant.mp3", title: "The Horse and the Infant", saga: "Troy Saga" },
  { file: "Epic The Musical_02_Just a Man.mp3", title: "Just a Man", saga: "Troy Saga" },
  { file: "Epic The Musical_03_Full Speed Ahead.mp3", title: "Full Speed Ahead", saga: "Troy Saga" },
  { file: "Epic The Musical_04_Open Arms.mp3", title: "Open Arms", saga: "Troy Saga" },
  { file: "Epic The Musical_05_Warrior of the Mind.mp3", title: "Warrior of the Mind", saga: "Troy Saga" },

  { file: "Epic The Musical_06_Polyphemus.mp3", title: "Polyphemus", saga: "Cyclops Saga" },
  { file: "Epic The Musical_07_Survive.mp3", title: "Survive", saga: "Cyclops Saga" },
  { file: "Epic The Musical_08_Remember Them.mp3", title: "Remember Them", saga: "Cyclops Saga" },

  { file: "Epic The Musical_09_My Goodbye.mp3", title: "My Goodbye", saga: "Ocean Saga" },
  { file: "Epic The Musical_10_Storm.mp3", title: "Storm", saga: "Ocean Saga" },
  { file: "Epic The Musical_11_Luck Runs Out.mp3", title: "Luck Runs Out", saga: "Ocean Saga" },
  { file: "Epic The Musical_12_Keep Your Friends Close.mp3", title: "Keep Your Friends Close", saga: "Ocean Saga" },
  { file: "Epic The Musical_13_Ruthlessness.mp3", title: "Ruthlessness", saga: "Ocean Saga" },

  { file: "Epic The Musical_14_Puppeteer.mp3", title: "Puppeteer", saga: "Circe Saga" },
  { file: "Epic The Musical_15_Wouldn't You Like.mp3", title: "Wouldn't You Like", saga: "Circe Saga" },
  { file: "Epic The Musical_16_Done For.mp3", title: "Done For", saga: "Circe Saga" },
  { file: "Epic The Musical_17_There Are Other Ways.mp3", title: "There Are Other Ways", saga: "Circe Saga" },

  { file: "Epic The Musical_18_The Underworld.mp3", title: "The Underworld", saga: "Underworld Saga" },
  { file: "Epic The Musical_19_No Longer You.mp3", title: "No Longer You", saga: "Underworld Saga" },
  { file: "Epic The Musical_20_Monster.mp3", title: "Monster", saga: "Underworld Saga" },

  { file: "Epic The Musical_21_Suffering.mp3", title: "Suffering", saga: "Thunder Saga" },
  { file: "Epic The Musical_22_Different Beast.mp3", title: "Different Beast", saga: "Thunder Saga" },
  { file: "Epic The Musical_23_Scylla.mp3", title: "Scylla", saga: "Thunder Saga" },
  { file: "Epic The Musical_24_Mutiny.mp3", title: "Mutiny", saga: "Thunder Saga" },
  { file: "Epic The Musical_25_Thunder Bringer.mp3", title: "Thunder Bringer", saga: "Thunder Saga" },

  { file: "Epic The Musical_26_Legendary.mp3", title: "Legendary", saga: "Wisdom Saga" },
  { file: "Epic The Musical_27_Little Wolf.mp3", title: "Little Wolf", saga: "Wisdom Saga" },
  { file: "Epic The Musical_28_We'll Be Fine.mp3", title: "We'll Be Fine", saga: "Wisdom Saga" },
  { file: "Epic The Musical_29_Love in Paradise.mp3", title: "Love in Paradise", saga: "Wisdom Saga" },
  { file: "Epic The Musical_30_God Games.mp3", title: "God Games", saga: "Wisdom Saga" },
];

const audio = document.getElementById("audio");
const player = document.getElementById("player");
const sagaTag = document.getElementById("sagaTag");
const trackTitle = document.getElementById("trackTitle");
const playBtn = document.getElementById("playBtn");
const playIcon = document.getElementById("playIcon");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const progress = document.getElementById("progress");
const curTimeEl = document.getElementById("curTime");
const durTimeEl = document.getElementById("durTime");
const playlistDiv = document.getElementById("playlist");

const ICON_PLAY = '<path d="M7 5l12 7-12 7z" stroke-linejoin="round"/>';
const ICON_PAUSE = '<path d="M8 5v14M16 5v14" stroke-linecap="round"/>';

let currentSong = 0;
let hasStarted = false;
let isSeeking = false;

function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function renderPlaylist() {
  playlistDiv.innerHTML = "";
  songs.forEach((song, index) => {
    const row = document.createElement("div");
    row.className = "song-row";
    if (index === currentSong) row.classList.add("active");
    row.innerHTML = `
      <span class="track-no">${String(index + 1).padStart(2, "0")}</span>
      <span class="track-name">${song.title}</span>
      <span class="saga-chip">${song.saga}</span>
      <span class="eq"><span></span><span></span><span></span></span>
    `;
    row.addEventListener("click", () => {
      currentSong = index;
      loadSong(currentSong);
      playSong();
    });
    playlistDiv.appendChild(row);
  });
}

function updateActiveRow() {
  document.querySelectorAll(".song-row").forEach((el, i) => {
    el.classList.toggle("active", i === currentSong);
  });
}

function loadSong(index) {
  const song = songs[index];
  audio.src = song.file;
  sagaTag.textContent = song.saga;
  trackTitle.textContent = song.title;
  updateActiveRow();
  progress.value = 0;
  curTimeEl.textContent = "0:00";
  durTimeEl.textContent = "0:00";
}

function playSong() {
  hasStarted = true;
  audio.play().catch(() => {
    
    setPausedUI();
  });
  setPlayingUI();
}

function pauseSong() {
  audio.pause();
  setPausedUI();
}

function setPlayingUI() {
  playIcon.innerHTML = ICON_PAUSE;
  playBtn.setAttribute("aria-label", "Pause");
  player.classList.remove("is-paused");
}

function setPausedUI() {
  playIcon.innerHTML = ICON_PLAY;
  playBtn.setAttribute("aria-label", "Play");
  player.classList.add("is-paused");
}

function togglePlay() {
  if (!hasStarted) {
    loadSong(currentSong);
    playSong();
    return;
  }
  if (audio.paused) {
    playSong();
  } else {
    pauseSong();
  }
}

function nextSong() {
  currentSong = (currentSong + 1) % songs.length;
  loadSong(currentSong);
  playSong();
}

function prevSong() {
  currentSong = (currentSong - 1 + songs.length) % songs.length;
  loadSong(currentSong);
  playSong();
}

playBtn.addEventListener("click", togglePlay);
nextBtn.addEventListener("click", nextSong);
prevBtn.addEventListener("click", prevSong);

audio.addEventListener("timeupdate", () => {
  if (audio.duration && !isSeeking) {
    progress.value = (audio.currentTime / audio.duration) * 100;
    curTimeEl.textContent = formatTime(audio.currentTime);
  }
});

audio.addEventListener("loadedmetadata", () => {
  durTimeEl.textContent = formatTime(audio.duration);
});

progress.addEventListener("input", () => {
  isSeeking = true;
  if (audio.duration) {
    curTimeEl.textContent = formatTime((progress.value / 100) * audio.duration);
  }
});

progress.addEventListener("change", () => {
  if (audio.duration) {
    audio.currentTime = (progress.value / 100) * audio.duration;
  }
  isSeeking = false;
});

audio.addEventListener("ended", nextSong);
audio.addEventListener("play", setPlayingUI);
audio.addEventListener("pause", setPausedUI);

// Init
player.classList.add("is-paused");
sagaTag.textContent = "Select a song to begin";
trackTitle.textContent = "Epic: The Musical";
renderPlaylist();
