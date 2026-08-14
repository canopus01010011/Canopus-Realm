
// Constants
const WIN_PATTERNS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// Game State
let gameMode = null;
let currentPlayer = 'X';
let board = Array(9).fill('');
let gameActive = false;
let roundCount = 0;

// Normal Mode State
let normalScores = { X: 0, O: 0 };
let normalPlayer1Name = "Player 1";
let normalPlayer2Name = "Player 2";

// Competition Mode State
let competitionPlayers = [];
let competitionMatches = 3;
let tournament = {
    players: [],
    matches: [],
    currentRound: 0,
    currentMatchIndex: 0,
    standings: {}
};

// DOM Elements
const modeSelector = document.getElementById('modeSelector');
const normalSetup = document.getElementById('normalSetup');
const competitionSetup = document.getElementById('competitionSetup');
const normalGameContainer = document.getElementById('normalGameContainer');
const competitionGameContainer = document.getElementById('competitionGameContainer');
const toast = document.getElementById('toast');


// Starfield animation
function createStarfield() {
    const canvas = document.getElementById('starfield');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const stars = [];
    
    // Generate stars
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5,
            opacity: Math.random() * 0.5 + 0.5,
            twinkleSpeed: Math.random() * 0.02 + 0.01
        });
    }
    
    // Animation
    function animate() {
        ctx.fillStyle = 'rgba(5, 7, 13, 1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        stars.forEach(star => {
            star.opacity += (Math.random() - 0.5) * star.twinkleSpeed;
            star.opacity = Math.max(0.2, Math.min(1, star.opacity));
            
            ctx.fillStyle = `rgba(234, 243, 242, ${star.opacity})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

// Cursor glow effect
function initCursorGlow() {
    const glow = document.getElementById('cursorGlow');
    document.addEventListener('mousemove', (e) => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    });
}

// Initialize on load
window.addEventListener('load', () => {
    createStarfield();
    initCursorGlow();
});


// MODE SELECTION


function selectMode(mode) {
    gameMode = mode;
    modeSelector.classList.remove('active');
    
    if (mode === 'normal') {
        normalSetup.classList.remove('hidden');
    } else {
        competitionSetup.classList.remove('hidden');
        updatePlayerInputs();
        
    }
}

function backToMode() {
    gameMode = null;
    modeSelector.classList.add('active');
    normalSetup.classList.add('hidden');
    competitionSetup.classList.add('hidden');
    normalGameContainer.classList.add('hidden');
    competitionGameContainer.classList.add('hidden');
    document.getElementById('tournamentResults').classList.add('hidden');
}

function exitGame() {
    backToMode();
}

// NORMAL MODE

function startNormalMode() {
    const p1Input = document.getElementById('normalPlayer1').value.trim();
    const p2Input = document.getElementById('normalPlayer2').value.trim();
    
    if (!p1Input || !p2Input) {
        showToast('Please enter both player names', 'error');
        return;
    }
    
    normalPlayer1Name = p1Input;
    normalPlayer2Name = p2Input;
    normalScores = { X: 0, O: 0 };
    
    normalSetup.classList.add('hidden');
    normalGameContainer.classList.remove('hidden');
    
    resetNormalGame();
}

function resetNormalGame() {
    board = Array(9).fill('');
    gameActive = true;
    currentPlayer = Math.random() < 0.5 ? 'X' : 'O';
    roundCount++;
    
    createGameBoard('normal');
    updateNormalDisplay();
}

function createGameBoard(mode) {
    const boardElement = mode === 'normal' 
        ? document.getElementById('normalGameBoard')
        : document.getElementById('competitionGameBoard');
    
    boardElement.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = `cell ${board[i] ? `filled ${board[i]}` : ''}`;
        cell.textContent = board[i];
        cell.addEventListener('click', () => makeMove(i, mode));
        boardElement.appendChild(cell);
    }
}

function makeMove(index, mode) {
    if (board[index] !== '' || !gameActive) return;
    
    board[index] = currentPlayer;
    createGameBoard(mode);
    
    if (checkWin()) {
        if (mode === 'normal') {
            handleNormalWin();
        } else {
            handleCompetitionWin();
        }
    } else if (board.every(cell => cell !== '')) {
        if (mode === 'normal') {
            handleNormalDraw();
        } else {
            handleCompetitionDraw();
        }
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        if (mode === 'normal') {
            updateNormalDisplay();
        } else {
            updateCompetitionDisplay();
        }
    }
}

function checkWin() {
    return WIN_PATTERNS.some(pattern => {
        const [a, b, c] = pattern;
        return board[a] && board[a] === board[b] && board[b] === board[c];
    });
}

function handleNormalWin() {
    gameActive = false;
    normalScores[currentPlayer]++;
    const playerName = currentPlayer === 'X' ? normalPlayer1Name : normalPlayer2Name;
    document.getElementById('normalCurrentTurn').innerHTML = `<span style="color: var(--success); font-weight: 700;">🎉 ${playerName} wins!</span>`;
    updateNormalDisplay();
}

function handleNormalDraw() {
    gameActive = false;
    document.getElementById('normalCurrentTurn').innerHTML = `<span style="color: var(--warning);">🤝 It's a draw!</span>`;
    updateNormalDisplay();
}

function updateNormalDisplay() {
    const player1Symbol = '🔴';
    const player2Symbol = '🔵';
    
    if (gameActive) {
        const playerName = currentPlayer === 'X' ? normalPlayer1Name : normalPlayer2Name;
        const symbol = currentPlayer === 'X' ? player1Symbol : player2Symbol;
        document.getElementById('normalCurrentTurn').innerHTML = `${symbol} ${playerName}'s Turn (${currentPlayer})`;
    }
    
    const score1Div = document.getElementById('score1');
    const score2Div = document.getElementById('score2');
    
    score1Div.innerHTML = `
        <div class="player-name">${normalPlayer1Name}</div>
        <div class="score-value">${normalScores.X}</div>
    `;
    
    score2Div.innerHTML = `
        <div class="player-name">${normalPlayer2Name}</div>
        <div class="score-value">${normalScores.O}</div>
    `;
}

// COMPETITION MODE

function updatePlayerInputs() {
    const numPlayers = parseInt(document.getElementById('numPlayers').value);
    const container = document.getElementById('playerInputsContainer');
    container.innerHTML = '';
    
    for (let i = 0; i < numPlayers; i++) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `
            <label for="compPlayer${i}">Player ${i + 1}</label>
            <input type="text" id="compPlayer${i}" placeholder="Enter player name..." maxlength="20">
        `;
        container.appendChild(div);
    }
}

function startCompetitionMode() {
    const numPlayers = parseInt(document.getElementById('numPlayers').value);
    competitionMatches = parseInt(document.getElementById('numMatches').value);
    
    // Validate
    if (competitionMatches < 3 || competitionMatches % 2 === 0) {
        showToast('Number of matches must be odd and at least 3', 'error');
        return;
    }
    
    // Get player names
    competitionPlayers = [];
    for (let i = 0; i < numPlayers; i++) {
        const name = document.getElementById(`compPlayer${i}`).value.trim();
        if (!name) {
            showToast(`Please enter name for Player ${i + 1}`, 'error');
            return;
        }
        competitionPlayers.push({
            id: i,
            name: name,
            wins: 0,
            losses: 0,
            points: 0
        });
    }
    
    competitionSetup.classList.add('hidden');
    competitionGameContainer.classList.remove('hidden');
    
    initializeTournament();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function initializeTournament() {
    // Shuffle players
    tournament.players = shuffleArray([...competitionPlayers]);
    tournament.standings = {};
    tournament.currentRound = 0;
    tournament.currentMatchIndex = 0;
    tournament.matches = [];
    
    // Initialize standings
    tournament.players.forEach(p => {
        tournament.standings[p.id] = {
            name: p.name,
            matchesWon: 0,
            gamesWon: 0
        };
    });
    
    // Generate matches for round 1
    generateRound();
}

function generateRound() {
    tournament.matches = [];
    const players = [...tournament.players];
    
    // Shuffle for random matchups
    shuffleArray(players);
    
    for (let i = 0; i < players.length - 1; i += 2) {
        tournament.matches.push({
            player1: players[i],
            player2: players[i + 1],
            gamesPlayed: 0,
            player1Wins: 0,
            player2Wins: 0,
            completed: false,
            winner: null
        });
    }
    
    // If odd number, one player advances automatically
    if (players.length % 2 === 1) {
        tournament.matches.push({
            player1: players[players.length - 1],
            player2: null,
            gamesPlayed: competitionMatches,
            player1Wins: Math.ceil(competitionMatches / 2),
            player2Wins: 0,
            completed: true,
            winner: players[players.length - 1]
        });
    }
    
    tournament.currentMatchIndex = 0;
    loadMatch(0);
}

function loadMatch(index) {
    if (index >= tournament.matches.length) {
        advanceRound();
        return;
    }
    
    const match = tournament.matches[index];
    
    if (match.player2 === null) {
        // Auto advance
        tournament.currentMatchIndex++;
        loadMatch(tournament.currentMatchIndex);
        return;
    }
    
    // Start new game for this match
    board = Array(9).fill('');
    gameActive = true;
    currentPlayer = Math.random() < 0.5 ? 'X' : 'O';
    
    createGameBoard('competition');
    updateCompetitionDisplay();
    renderBracket();
}

function handleCompetitionWin() {
    gameActive = false;
    const match = tournament.matches[tournament.currentMatchIndex];
    
    if (currentPlayer === 'X') {
        match.player1Wins++;
    } else {
        match.player2Wins++;
    }
    
    match.gamesPlayed++;
    
    // Check if match is complete
    const winsNeeded = Math.ceil(competitionMatches / 2);
    
    if (match.player1Wins >= winsNeeded) {
        completeMatch(match.player1);
    } else if (match.player2Wins >= winsNeeded) {
        completeMatch(match.player2);
    } else {
        // Continue match
        board = Array(9).fill('');
        gameActive = true;
        currentPlayer = Math.random() < 0.5 ? 'X' : 'O';
        createGameBoard('competition');
        updateCompetitionDisplay();
    }
}

function handleCompetitionDraw() {
    gameActive = false;
    
    // In competition mode, draws count as ties - continue playing
    const match = tournament.matches[tournament.currentMatchIndex];
    match.gamesPlayed++;
    
    const winsNeeded = Math.ceil(competitionMatches / 2);
    
    // Check if someone has already won
    if (match.player1Wins >= winsNeeded) {
        completeMatch(match.player1);
    } else if (match.player2Wins >= winsNeeded) {
        completeMatch(match.player2);
    } else {
        // Continue match
        setTimeout(() => {
            board = Array(9).fill('');
            gameActive = true;
            currentPlayer = Math.random() < 0.5 ? 'X' : 'O';
            createGameBoard('competition');
            updateCompetitionDisplay();
        }, 1000);
    }
}

function completeMatch(winner) {
    gameActive = false;
    const match = tournament.matches[tournament.currentMatchIndex];
    match.completed = true;
    match.winner = winner;
    
    tournament.standings[winner.id].matchesWon++;
    tournament.standings[winner.id].gamesWon += match.gamesPlayed;
    
    document.getElementById('nextRoundBtn').classList.remove('hidden');
    renderBracket();
}

function nextCompetitionRound() {
    tournament.currentMatchIndex++;
    document.getElementById('nextRoundBtn').classList.add('hidden');
    
    if (tournament.currentMatchIndex < tournament.matches.length) {
        loadMatch(tournament.currentMatchIndex);
    } else {
        advanceRound();
    }
}

function advanceRound() {
    // Get match winners
    const winners = tournament.matches
        .filter(m => m.completed)
        .map(m => m.winner)
        .filter(w => w !== null);
    
    // Check if tournament is over (only 1 player left)
    if (winners.length === 1) {
        endTournament();
        return;
    }
    
    // Update player list for next round
    tournament.players = winners;
    tournament.currentRound++;
    
    generateRound();
}

function endTournament() {
    const gameArea = document.getElementById('competitionGameArea');
    gameArea.classList.add('hidden');
    document.getElementById('tournamentResults').classList.remove('hidden');
    
    // Sort standings
    const sorted = Object.values(tournament.standings)
        .sort((a, b) => b.matchesWon - a.matchesWon || b.gamesWon - a.gamesWon);
    
    let resultsHTML = '';
    sorted.forEach((player, index) => {
        let medal = '';
        let rankClass = '';
        if (index === 0) {
            medal = '🥇';
            rankClass = 'first';
        } else if (index === 1) {
            medal = '🥈';
            rankClass = 'second';
        } else if (index === 2) {
            medal = '🥉';
            rankClass = 'third';
        }
        
        resultsHTML += `
            <div class="result-item">
                <div class="result-rank ${rankClass}">${medal || (index + 1)}</div>
                <div class="result-name">${player.name}</div>
                <div class="result-score">${player.matchesWon} wins • ${player.gamesWon} games</div>
            </div>
        `;
    });
    
    document.getElementById('resultsContent').innerHTML = resultsHTML;
}

function updateCompetitionDisplay() {
    if (tournament.currentMatchIndex >= tournament.matches.length) return;
    
    const match = tournament.matches[tournament.currentMatchIndex];
    const player1Symbol = '🔴';
    const player2Symbol = '🔵';
    
    document.getElementById('matchTitle').textContent = `${match.player1.name} vs ${match.player2.name}`;
    
    document.getElementById('matchScore1').textContent = 
        `${player1Symbol} ${match.player1.name}: ${match.player1Wins}`;
    document.getElementById('matchScore2').textContent = 
        `${player2Symbol} ${match.player2.name}: ${match.player2Wins}`;
    
    if (gameActive) {
        const playerName = currentPlayer === 'X' ? match.player1.name : match.player2.name;
        document.getElementById('normalCurrentTurn').innerHTML = 
            `${currentPlayer === 'X' ? player1Symbol : player2Symbol} ${playerName}'s Turn`;
    }
}

function renderBracket() {
    const bracketDiv = document.getElementById('tournamentBracket');
    bracketDiv.innerHTML = '';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'bracket-title';
    titleDiv.textContent = `🏆 Round ${tournament.currentRound + 1}`;
    bracketDiv.appendChild(titleDiv);
    
    tournament.matches.forEach((match, index) => {
        const matchDiv = document.createElement('div');
        matchDiv.className = `bracket-match ${index === tournament.currentMatchIndex ? 'active' : ''} ${match.completed ? 'completed' : ''}`;
        
        if (match.player2) {
            const p1Class = match.completed && match.winner.id === match.player1.id ? 'winner' : '';
            const p2Class = match.completed && match.winner.id === match.player2.id ? 'winner' : '';
            
            matchDiv.innerHTML = `
                <div class="match-player ${p1Class}">
                    <span>${match.player1.name}</span>
                    <span>${match.player1Wins}</span>
                </div>
                <div class="match-player ${p2Class}">
                    <span>${match.player2.name}</span>
                    <span>${match.player2Wins}</span>
                </div>
            `;
        } else {
            matchDiv.innerHTML = `
                <div class="match-player winner">
                    <span>➤ ${match.player1.name}</span>
                    <span>BYE</span>
                </div>
            `;
        }
        
        bracketDiv.appendChild(matchDiv);
    });
}

// UTILITIES

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Handle window resize for starfield
window.addEventListener('resize', () => {
    const canvas = document.getElementById('starfield');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

const container = document.getElementById("playerInputsContainer");

document.getElementById("scrollUp").addEventListener("click", () => {
    container.scrollBy({
        top: -150,
        behavior: "smooth"
    });
});

document.getElementById("scrollDown").addEventListener("click", () => {
    container.scrollBy({
        top: 150,
        behavior: "smooth"
    });
});

function openMobileBracket() {
    const bracket = document.getElementById('tournamentBracket');

    if (bracket) {
        bracket.classList.add('mobile-bracket-open');
        document.body.classList.add('bracket-open');
    }
}

function closeMobileBracket() {
    const bracket = document.getElementById('tournamentBracket');

    if (bracket) {
        bracket.classList.remove('mobile-bracket-open');
        document.body.classList.remove('bracket-open');
    }
}