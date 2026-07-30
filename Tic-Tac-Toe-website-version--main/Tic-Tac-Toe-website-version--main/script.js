let currentPlayer = '';
let gameActive = false;
let gameState = ["", "", "", "", "", "", "", "", ""];
let scoreX = 0;
let scoreO = 0;

const gameBoard = document.getElementById("gameBoard");
const statusText = document.getElementById("status");
const coinResultText = document.getElementById("coinResult");
const startBtn = document.getElementById("startBtn");
const playerXScore = document.getElementById("playerX");
const playerOScore = document.getElementById("playerO");

for (let i = 0; i < 9; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  cell.addEventListener("click", () => makeMove(cell, i));
  gameBoard.appendChild(cell);
}

startBtn.addEventListener("click", () => {
  coinResultText.innerText = "Flipping coin...";
  gameActive = false;

  setTimeout(() => {
    const flip = Math.random() < 0.5 ? "X" : "O";
    currentPlayer = flip;
    gameActive = true;
    coinResultText.innerText = `Coin says: Player ${flip} starts!`;
    statusText.innerText = `🎮 Player ${currentPlayer}'s Turn`;
  }, 1500);
});

function makeMove(cell, index) {
  if (!gameActive || gameState[index] !== "") return;

  gameState[index] = currentPlayer;
  cell.textContent = currentPlayer;
  cell.classList.add(currentPlayer === "X" ? "red" : "blue");

  if (checkWinner()) {
    statusText.innerText = `🏆 Player ${currentPlayer} wins!`;
    gameActive = false;
    updateScore();
  } else if (!gameState.includes("")) {
    statusText.innerText = "🤝 It's a Draw!";
    gameActive = false;
  } else {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusText.innerText = `🎮 Player ${currentPlayer}'s Turn`;
  }
}

function checkWinner() {
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return winPatterns.some(pattern => {
    const [a, b, c] = pattern;
    return (
      gameState[a] &&
      gameState[a] === gameState[b] &&
      gameState[b] === gameState[c]
    );
  });
}

function updateScore() {
  if (currentPlayer === "X") {
    scoreX++;
    playerXScore.textContent = `Player X (🔴): ${scoreX}`;
  } else {
    scoreO++;
    playerOScore.textContent = `Player O (🔵): ${scoreO}`;
  }
}

function resetGame() {
  gameState = ["", "", "", "", "", "", "", "", ""];
  const cells = document.querySelectorAll(".cell");
  cells.forEach(cell => {
    cell.textContent = "";
    cell.classList.remove("red", "blue");
  });
  statusText.innerText = "Press Start to play!";
  coinResultText.innerText = "Press Start to Flip";
  gameActive = false;
}
