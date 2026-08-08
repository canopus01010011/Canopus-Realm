let display = '0';
let sciDisplay = '0';
let calculation = '';
let sciCalculation = '';
let sciMemory = 0;
let sciLastAnswer = '0';
let history = JSON.parse(localStorage.getItem('calcHistory')) || [];
let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;

// DOM Elements
const displayEl = document.getElementById('display');
const sciDisplayEl = document.getElementById('sci-display');
const modeButtons = document.querySelectorAll('.mode-btn');
const modeContents = document.querySelectorAll('.mode-content');

//   INITIALIZATION  
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

//   BASIC CALCULATOR  
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

//   SCIENTIFIC CALCULATOR  
function sciInsert(value) {
    if (sciDisplay === 'Error') {
        sciDisplay = '0';
    }

    const isNumberOrDot = /^[0-9.]$/.test(value);
    const isFunctionOrConstant = /^(sin\(|cos\(|tan\(|ln\(|log\(|sqrt\(|pi|e|exp\()/i.test(value);
    const isOperator = /^[+\-×÷^()]$/.test(value) || value === '1/';

    if (sciDisplay === '0') {
        if (isNumberOrDot) {
            sciDisplay = value === '.' ? '0.' : value;
        } else if (isFunctionOrConstant || isOperator) {
            sciDisplay = value;
        } else {
            sciDisplay = value;
        }
    } else {
        sciDisplay += value;
    }

    updateSciDisplay();
}

function sciToggleSign() {
    if (sciDisplay === '0' || sciDisplay === '') return;

    if (sciDisplay.startsWith('-')) {
        sciDisplay = sciDisplay.slice(1);
    } else {
        sciDisplay = '-' + sciDisplay;
    }
    updateSciDisplay();
}

function sciPower(power) {
    if (sciDisplay && sciDisplay !== 'Error') {
        sciDisplay = `(${sciDisplay})**${power}`;
        updateSciDisplay();
    }
}

function sciReciprocal() {
    if (sciDisplay && sciDisplay !== 'Error') {
        sciDisplay = `1/(${sciDisplay})`;
        updateSciDisplay();
    }
}

function sciFactorial() {
    if (sciDisplay && sciDisplay !== 'Error') {
        sciDisplay = `fact(${sciDisplay})`;
        updateSciDisplay();
    }
}

function sciMemoryClear() {
    sciMemory = 0;
    showSciStatus('MC cleared');
}

function sciMemoryRecall() {
    sciDisplay = String(sciMemory);
    updateSciDisplay();
}

function sciMemoryAdd() {
    const value = Number(sciDisplay);
    if (Number.isFinite(value)) {
        sciMemory += value;
        showSciStatus('M+ saved');
    }
}

function sciMemorySubtract() {
    const value = Number(sciDisplay);
    if (Number.isFinite(value)) {
        sciMemory -= value;
        showSciStatus('M- saved');
    }
}

function sciRecallAns() {
    sciDisplay = sciLastAnswer;
    updateSciDisplay();
}

function sciCalculate() {
    const expression = sciDisplay.trim();
    if (!expression || expression === 'Error') return;

    try {
        const cleaned = expression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/\bpi\b/g, 'Math.PI')
            .replace(/\be\b/g, 'Math.E')
            .replace(/exp\(/g, 'Math.exp(')
            .replace(/\^/g, '**')
            .replace(/sqrt\(/g, 'Math.sqrt(')
            .replace(/ln\(/g, 'Math.log(')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/fact\(([^)]+)\)/g, 'factorial($1)')
            .replace(/([0-9]+)!/g, 'factorial($1)');

        let result = eval(cleaned);
        if (typeof result === 'number' && !Number.isFinite(result)) throw new Error('Math error');
        result = Math.round(result * 100000000) / 100000000;

        sciLastAnswer = String(result);
        saveToHistory(expression, result);
        sciDisplay = String(result);
        updateSciDisplay();
        showSciStatus('Result saved');
    } catch (e) {
        sciDisplay = 'Error';
        updateSciDisplay();
    }
}

function sciClearDisplay() {
    sciDisplay = '0';
    sciCalculation = '';
    updateSciDisplay();
}

function sciDeleteLast() {
    if (sciDisplay.length > 1) {
        sciDisplay = sciDisplay.slice(0, -1);
    } else {
        sciDisplay = '0';
    }
    updateSciDisplay();
}

function updateSciDisplay() {
    sciDisplayEl.value = sciDisplay;
}

function showSciStatus(message) {
    const status = document.createElement('div');
    status.className = 'status-toast';
    status.textContent = message;
    document.body.appendChild(status);
    setTimeout(() => status.remove(), 1800);
}

function factorial(n) {
    n = Number(n);
    if (!Number.isInteger(n) || n < 0) return NaN;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

//   HISTORY  
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

//   MATH QUIZ  
function generateQuizQuestions() {
    const operations = ['+', '-', '×', '÷'];
    const questions = [];
    const totalQuestions = 10;

    for (let i = 0; i < totalQuestions; i++) {
        const op = operations[Math.floor(Math.random() * operations.length)];
        let a = Math.floor(Math.random() * 12) + 1;
        let b = Math.floor(Math.random() * 12) + 1;
        let question = '';
        let answer = 0;

        if (op === '+') {
            answer = a + b;
            question = `${a} + ${b} = ?`;
        } else if (op === '-') {
            if (a < b) [a, b] = [b, a];
            answer = a - b;
            question = `${a} - ${b} = ?`;
        } else if (op === '×') {
            answer = a * b;
            question = `${a} × ${b} = ?`;
        } else {
            answer = a;
            const product = a * b;
            question = `${product} ÷ ${b} = ?`;
        }

        questions.push({ question, answer });
    }

    quizQuestions = questions.sort(() => Math.random() - 0.5);
}

function loadQuizQuestion() {
    const feedbackEl = document.getElementById('feedback');
    const progressFill = document.getElementById('quiz-progress-fill');
    feedbackEl.textContent = '';
    feedbackEl.classList.remove('correct', 'incorrect');
    document.getElementById('quiz-submit').disabled = false;
    document.getElementById('quiz-next').disabled = true;
    document.getElementById('answer-input').disabled = false;

    if (quizIndex < quizQuestions.length) {
        const question = quizQuestions[quizIndex];
        document.getElementById('question-text').textContent = question.question;
        document.getElementById('answer-input').value = '';
        document.getElementById('answer-input').focus();
        document.getElementById('quiz-count').textContent = quizIndex + 1;
        progressFill.style.width = `${(quizIndex / quizQuestions.length) * 100}%`;
    } else {
        completeQuiz();
    }
}

function submitAnswer() {
    const input = document.getElementById('answer-input');
    const answerText = input.value.trim();
    const answer = Number(answerText);
    const feedback = document.getElementById('feedback');
    const question = quizQuestions[quizIndex];

    feedback.textContent = '';
    feedback.classList.remove('correct', 'incorrect');

    if (answerText === '' || Number.isNaN(answer)) {
        feedback.textContent = 'Please enter a valid number.';
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

    quizAnswered = true;
    document.getElementById('quiz-submit').disabled = true;
    document.getElementById('quiz-next').disabled = false;
    input.disabled = true;
}

function nextQuizQuestion() {
    if (!quizAnswered) return;
    quizAnswered = false;
    quizIndex++;
    if (quizIndex < quizQuestions.length) {
        loadQuizQuestion();
    } else {
        completeQuiz();
    }
}

function completeQuiz() {
    const percentage = (quizScore / quizQuestions.length) * 100;
    const messageElement = document.querySelector('.quiz-message');

    document.getElementById('quiz-content').style.display = 'none';
    document.getElementById('quiz-complete').style.display = 'block';
    document.getElementById('final-score').textContent = quizScore;
    
    let message = '';
    if (percentage === 100) message = '🏆 Perfect Score! You’re a mental math master.';
    else if (percentage >= 80) message = '⭐ Great Job! Keep sharpening your skills.';
    else if (percentage >= 60) message = '👍 Good Effort! Practice makes perfect.';
    else message = '📚 Keep Practicing! Try again to improve your score.';

    messageElement.textContent = message;
}

function restartQuiz() {
    quizIndex = 0;
    quizScore = 0;
    quizAnswered = false;
    generateQuizQuestions();
    
    document.getElementById('quiz-content').style.display = 'block';
    document.getElementById('quiz-complete').style.display = 'none';
    document.getElementById('quiz-score').textContent = '0';
    document.getElementById('quiz-count').textContent = '1';
    document.getElementById('quiz-next').disabled = true;
    
    loadQuizQuestion();
}

//   UTILITIES  
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('Advanced Calculator loaded successfully');
