// ============= GLOBAL STATE =============
let display = '0';
let sciDisplay = '0';
let calculation = '';
let sciCalculation = '';
let history = JSON.parse(localStorage.getItem('calcHistory')) || [];
let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;

// DOM Elements
const displayEl = document.getElementById('display');
const sciDisplayEl = document.getElementById('sci-display');
const modeButtons = document.querySelectorAll('.mode-btn');
const modeContents = document.querySelectorAll('.mode-content');

// ============= INITIALIZATION =============
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateDisplay();
    updateSciDisplay();
    loadHistory();
    generateQuizQuestions();
    loadQuizQuestion();
});

function setupEventListeners() {
    // Mode switching
    modeButtons.forEach(btn => {
        btn.addEventListener('click', switchMode);
    });

    // Allow keyboard input
    document.addEventListener('keydown', handleKeyPress);
}

function switchMode(e) {
    const mode = e.target.closest('.mode-btn').getAttribute('data-mode');
    
    modeButtons.forEach(btn => btn.classList.remove('active'));
    modeContents.forEach(content => content.classList.remove('active'));
    
    e.target.closest('.mode-btn').classList.add('active');
    document.getElementById(mode + '-mode').classList.add('active');
}

// ============= BASIC CALCULATOR =============
function appendNumber(num) {
    if (display === '0' && num !== '.') {
        display = num;
    } else if (!(num === '.' && display.includes('.'))) {
        display += num;
    }
    updateDisplay();
}

function appendOperator(op) {
    if (calculation === '' && display !== '') {
        calculation = display + ' ' + op + ' ';
        display = '';
    } else if (display !== '') {
        calculation += display + ' ' + op + ' ';
        display = '';
    }
    updateDisplay();
}

function calculate() {
    if (calculation !== '' && display !== '') {
        try {
            const expr = calculation + display;
            let result = eval(expr.replace(/×/g, '*').replace(/÷/g, '/'));
            result = Math.round(result * 100000000) / 100000000; // Fix floating point errors
            
            // Save to history
            saveToHistory(expr, result);
            
            display = String(result);
            calculation = '';
            updateDisplay();
        } catch (e) {
            display = 'Error';
            calculation = '';
            updateDisplay();
        }
    }
}

function clearDisplay() {
    display = '0';
    calculation = '';
    updateDisplay();
}

function deleteLast() {
    if (display !== '') {
        display = display.slice(0, -1) || '0';
        updateDisplay();
    }
}

function updateDisplay() {
    displayEl.value = calculation + display;
}

function handleKeyPress(e) {
    if (document.getElementById('basic-mode').classList.contains('active')) {
        if (e.key >= '0' && e.key <= '9') appendNumber(e.key);
        if (e.key === '.') appendNumber('.');
        if (e.key === '+' || e.key === '-') appendOperator(e.key);
        if (e.key === '*') appendOperator('×');
        if (e.key === '/') { e.preventDefault(); appendOperator('÷'); }
        if (e.key === 'Enter') calculate();
        if (e.key === 'Backspace') deleteLast();
    }
}

// ============= SCIENTIFIC CALCULATOR =============
function sciAppendNumber(num) {
    if (sciDisplay === '0' && num !== '.') {
        sciDisplay = num;
    } else if (!(num === '.' && sciDisplay.includes('.'))) {
        sciDisplay += num;
    }
    updateSciDisplay();
}

function sciAppendOperator(op) {
    if (sciCalculation === '' && sciDisplay !== '') {
        sciCalculation = sciDisplay + op;
        sciDisplay = '';
    } else if (sciDisplay !== '') {
        sciCalculation += sciDisplay + op;
        sciDisplay = '';
    }
    updateSciDisplay();
}

function sciAppendValue(value) {
    if (value.includes('Math')) {
        sciCalculation += value + '(';
        updateSciDisplay();
    } else {
        sciDisplay = value;
        updateSciDisplay();
    }
}

function sciCalculate() {
    if (sciCalculation !== '' && sciDisplay !== '') {
        try {
            let expr = sciCalculation + sciDisplay;
            expr = expr.replace(/Math\.sqrt/g, 'Math.sqrt')
                      .replace(/Math\.sin/g, 'Math.sin')
                      .replace(/Math\.cos/g, 'Math.cos')
                      .replace(/Math\.tan/g, 'Math.tan')
                      .replace(/Math\.log/g, 'Math.log10')
                      .replace(/Math\.PI/g, Math.PI)
                      .replace(/Math\.E/g, Math.E)
                      .replace(/\^/g, '**')
                      .replace(/Math\.factorial/g, 'factorial');
            
            let result = eval(expr);
            result = Math.round(result * 100000000) / 100000000;
            
            saveToHistory(expr, result);
            
            sciDisplay = String(result);
            sciCalculation = '';
            updateSciDisplay();
        } catch (e) {
            sciDisplay = 'Error';
            sciCalculation = '';
            updateSciDisplay();
        }
    }
}

function sciClearDisplay() {
    sciDisplay = '0';
    sciCalculation = '';
    updateSciDisplay();
}

function sciDeleteLast() {
    if (sciDisplay !== '') {
        sciDisplay = sciDisplay.slice(0, -1) || '0';
        updateSciDisplay();
    }
}

function updateSciDisplay() {
    sciDisplayEl.value = sciCalculation + sciDisplay;
}

function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

// ============= HISTORY =============
function saveToHistory(expression, result) {
    history.unshift({ expression, result, date: new Date().toLocaleString() });
    if (history.length > 50) history.pop();
    localStorage.setItem('calcHistory', JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-message">No history yet. Start calculating!</p>';
        return;
    }
    
    history.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-expression">${escapeHtml(item.expression)}</div>
            <div class="history-result">${item.result}</div>
            <button class="btn btn-small" onclick="useFromHistory(${index})">
                <i class="fas fa-redo"></i> Use
            </button>
            <button class="btn btn-small" onclick="deleteFromHistory(${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        historyList.appendChild(historyItem);
    });
}

function useFromHistory(index) {
    const item = history[index];
    display = String(item.result);
    calculation = '';
    updateDisplay();
    
    // Switch to basic mode
    switchModeManually('basic');
}

function deleteFromHistory(index) {
    history.splice(index, 1);
    localStorage.setItem('calcHistory', JSON.stringify(history));
    loadHistory();
}

function clearHistory() {
    if (confirm('Clear all history?')) {
        history = [];
        localStorage.setItem('calcHistory', JSON.stringify(history));
        loadHistory();
    }
}

function switchModeManually(mode) {
    const btn = document.querySelector(`[data-mode="${mode}"]`);
    if (btn) btn.click();
}

// ============= MATH QUIZ =============
function generateQuizQuestions() {
    quizQuestions = [
        { question: '7 + 5 = ?', answer: 12 },
        { question: '15 - 8 = ?', answer: 7 },
        { question: '6 × 4 = ?', answer: 24 },
        { question: '20 ÷ 5 = ?', answer: 4 },
        { question: '9 × 9 = ?', answer: 81 },
        { question: '100 - 33 = ?', answer: 67 },
        { question: '12 + 8 + 5 = ?', answer: 25 },
        { question: '50 ÷ 2 = ?', answer: 25 },
        { question: '7 × 8 = ?', answer: 56 },
        { question: '144 ÷ 12 = ?', answer: 12 }
    ];
    quizQuestions = quizQuestions.sort(() => Math.random() - 0.5);
}

function loadQuizQuestion() {
    const feedbackEl = document.getElementById('feedback');
    feedbackEl.innerHTML = '';
    feedbackEl.classList.remove('correct', 'incorrect');
    
    if (quizIndex < quizQuestions.length) {
        const question = quizQuestions[quizIndex];
        document.getElementById('question-text').textContent = question.question;
        document.getElementById('answer-input').value = '';
        document.getElementById('answer-input').focus();
        
        document.getElementById('quiz-count').textContent = quizIndex + 1;
    } else {
        completeQuiz();
    }
}

function submitAnswer() {
    const input = document.getElementById('answer-input');
    const answer = parseInt(input.value);
    const feedback = document.getElementById('feedback');
    const question = quizQuestions[quizIndex];
    
    if (isNaN(answer)) {
        feedback.textContent = 'Please enter a valid number';
        feedback.classList.add('incorrect');
        return;
    }
    
    if (answer === question.answer) {
        quizScore++;
        feedback.textContent = '✓ Correct!';
        feedback.classList.add('correct');
        document.getElementById('quiz-score').textContent = quizScore;
    } else {
        feedback.textContent = `✗ Incorrect! The answer is ${question.answer}`;
        feedback.classList.add('incorrect');
    }
    
    quizIndex++;
    setTimeout(() => {
        loadQuizQuestion();
    }, 1500);
}

function completeQuiz() {
    const percentage = (quizScore / quizQuestions.length) * 100;
    
    document.getElementById('quiz-content').style.display = 'none';
    document.getElementById('quiz-complete').style.display = 'block';
    document.getElementById('final-score').textContent = quizScore;
    
    let message = '';
    if (percentage === 100) message = '🏆 Perfect Score!';
    else if (percentage >= 80) message = '⭐ Great Job!';
    else if (percentage >= 60) message = '👍 Good Effort!';
    else message = '📚 Keep Practicing!';
    
    document.querySelector('.final-score').innerHTML = `${message}<br>Your Score: <strong>${quizScore}/10</strong>`;
}

function restartQuiz() {
    quizIndex = 0;
    quizScore = 0;
    generateQuizQuestions();
    
    document.getElementById('quiz-content').style.display = 'block';
    document.getElementById('quiz-complete').style.display = 'none';
    document.getElementById('quiz-score').textContent = '0';
    document.getElementById('quiz-count').textContent = '1';
    
    loadQuizQuestion();
}

// ============= UTILITIES =============
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('Advanced Calculator loaded successfully');
