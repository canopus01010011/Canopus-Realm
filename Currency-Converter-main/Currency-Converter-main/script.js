// ============= GLOBAL STATE =============
const CURRENCIES = [
    "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "MXN",
    "BRL", "ZAR", "KRW", "SGD", "HKD", "NZD", "SEK", "NOK", "DKK", "RUB",
    "AED", "SAR", "QAR", "KWD", "BHD", "OMR", "JOD", "ILS", "EGP", "TRY"
];

let exchangeRates = {};
let conversionHistory = JSON.parse(localStorage.getItem('currencyHistory')) || [];
let favorites = JSON.parse(localStorage.getItem('currencyFavorites')) || [];
let chart = null;

const amountEl = document.getElementById('amount');
const fromCurrencyEl = document.getElementById('from-currency');
const toCurrencyEl = document.getElementById('to-currency');
const convertedAmountEl = document.getElementById('converted-amount');
const resultEl = document.getElementById('result');
const navLinks = document.querySelectorAll('.nav-link');
const tabContents = document.querySelectorAll('.tab-content');
const loader = document.getElementById('loader');

// ============= INITIALIZATION =============
document.addEventListener('DOMContentLoaded', () => {
    initializeCurrencies();
    setupEventListeners();
    fetchExchangeRates('USD');
    loadHistory();
    loadFavorites();
    setupChartSelects();
});

function initializeCurrencies() {
    CURRENCIES.forEach(code => {
        const option1 = document.createElement('option');
        option1.value = option1.text = code;
        fromCurrencyEl.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = option2.text = code;
        toCurrencyEl.appendChild(option2);
    });

    fromCurrencyEl.value = 'USD';
    toCurrencyEl.value = 'EUR';
}

function setupEventListeners() {
    // Tab navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(link.getAttribute('data-tab'));
        });
    });

    // Currency conversion events
    amountEl.addEventListener('input', convertCurrency);
    fromCurrencyEl.addEventListener('change', () => {
        fetchExchangeRates(fromCurrencyEl.value);
        convertCurrency();
    });
    toCurrencyEl.addEventListener('change', convertCurrency);
}

function switchTab(tabName) {
    navLinks.forEach(link => link.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');

    if (tabName === 'chart') {
        setTimeout(() => {
            if (chart) chart.resize();
        }, 100);
    }
}

// ============= EXCHANGE RATES =============
async function fetchExchangeRates(baseCurrency) {
    try {
        loader.style.display = 'flex';
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
        const data = await response.json();
        exchangeRates = data.rates;

        updateExchangeRateDisplay();
        updateLastUpdate();
        loader.style.display = 'none';
    } catch (error) {
        console.error('Error fetching rates:', error);
        resultEl.innerHTML = '<p style="color: #ff006e;">Failed to fetch exchange rates</p>';
        loader.style.display = 'none';
    }
}

function updateExchangeRateDisplay() {
    const fromCode = fromCurrencyEl.value;
    const toCode = toCurrencyEl.value;
    const rate = exchangeRates[toCode] || 0;

    document.getElementById('from-code').textContent = fromCode;
    document.getElementById('to-code').textContent = toCode;
    document.getElementById('exchange-rate').textContent = rate.toFixed(4);
}

function updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('last-update').textContent = timeString;
}

// ============= CONVERSION =============
function convertCurrency() {
    const amount = parseFloat(amountEl.value) || 0;
    const from = fromCurrencyEl.value;
    const to = toCurrencyEl.value;

    if (amount <= 0) {
        convertedAmountEl.value = '';
        resultEl.innerHTML = '<p>Enter an amount to convert</p>';
        return;
    }

    if (!exchangeRates[to]) {
        resultEl.innerHTML = '<p style="color: #ff006e;">Exchange rate not available</p>';
        return;
    }

    const rate = exchangeRates[to];
    const converted = (amount * rate).toFixed(2);

    convertedAmountEl.value = converted;

    resultEl.innerHTML = `
        <p>
            <strong>${amount}</strong> ${from}<br>
            <span style="color: #b0b0b0;">≈</span><br>
            <strong style="color: #00f5a0; font-size: 1.5rem;">${converted}</strong> ${to}
        </p>
        <p style="color: #b0b0b0; margin-top: 1rem;">Rate: 1 ${from} = ${rate.toFixed(4)} ${to}</p>
    `;
}

function swapCurrencies() {
    const temp = fromCurrencyEl.value;
    fromCurrencyEl.value = toCurrencyEl.value;
    toCurrencyEl.value = temp;

    fetchExchangeRates(fromCurrencyEl.value);
    convertCurrency();
}

function quickConvert(amount) {
    amountEl.value = amount;
    convertCurrency();
}

// ============= HISTORY =============
function addToHistory(from, to, amount, result, rate) {
    const historyItem = {
        from,
        to,
        amount: parseFloat(amount),
        result: parseFloat(result),
        rate,
        date: new Date().toLocaleString()
    };

    conversionHistory.unshift(historyItem);
    if (conversionHistory.length > 100) conversionHistory.pop();

    localStorage.setItem('currencyHistory', JSON.stringify(conversionHistory));
    loadHistory();
}

function loadHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    if (conversionHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-message">No history yet</p>';
        return;
    }

    conversionHistory.slice(0, 20).forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-info">
                <div class="history-conversion">
                    ${item.amount} ${item.from} → ${item.result} ${item.to}
                </div>
                <div class="history-time">${item.date}</div>
            </div>
            <div class="history-result">
                ${item.rate.toFixed(4)}
            </div>
            <button class="btn btn-small" onclick="useFromHistory(${index})">
                <i class="fas fa-redo"></i>
            </button>
        `;
        historyList.appendChild(historyItem);
    });
}

function useFromHistory(index) {
    const item = conversionHistory[index];
    amountEl.value = item.amount;
    fromCurrencyEl.value = item.from;
    toCurrencyEl.value = item.to;
    fetchExchangeRates(item.from);
    convertCurrency();
    switchTab('converter');
}

function clearHistory() {
    if (confirm('Clear all history?')) {
        conversionHistory = [];
        localStorage.setItem('currencyHistory', JSON.stringify(conversionHistory));
        loadHistory();
    }
}

// ============= FAVORITES =============
function addToFavorites() {
    const pair = `${fromCurrencyEl.value}/${toCurrencyEl.value}`;

    if (!favorites.find(f => f === pair)) {
        favorites.unshift(pair);
        localStorage.setItem('currencyFavorites', JSON.stringify(favorites));
        loadFavorites();
        showNotification('Added to favorites!');
    } else {
        showNotification('Already in favorites');
    }
}

function loadFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    favoritesList.innerHTML = '';

    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p class="empty-message">No favorites yet</p>';
        return;
    }

    favorites.forEach((pair, index) => {
        const [from, to] = pair.split('/');
        const rate = exchangeRates[to] || 'N/A';

        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'favorite-pair';
        favoriteItem.innerHTML = `
            <div class="favorite-info">
                <div class="favorite-pair-code">${from} / ${to}</div>
                <div class="favorite-pair-rate">1 ${from} = ${rate.toFixed ? rate.toFixed(4) : rate} ${to}</div>
            </div>
            <button class="btn btn-small" onclick="useFavorite('${from}', '${to}')">
                <i class="fas fa-arrow-right"></i> Use
            </button>
            <button class="btn btn-small btn-danger" onclick="removeFavorite(${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        favoritesList.appendChild(favoriteItem);
    });
}

function useFavorite(from, to) {
    fromCurrencyEl.value = from;
    toCurrencyEl.value = to;
    fetchExchangeRates(from);
    convertCurrency();
    switchTab('converter');
}

function removeFavorite(index) {
    favorites.splice(index, 1);
    localStorage.setItem('currencyFavorites', JSON.stringify(favorites));
    loadFavorites();
}

// ============= CHARTS =============
function setupChartSelects() {
    CURRENCIES.forEach(code => {
        let option = document.createElement('option');
        option.value = option.text = code;
        document.getElementById('chart-from').appendChild(option);

        option = document.createElement('option');
        option.value = option.text = code;
        document.getElementById('chart-to').appendChild(option);
    });

    document.getElementById('chart-from').value = 'USD';
    document.getElementById('chart-to').value = 'EUR';
}

function updateChart() {
    const from = document.getElementById('chart-from').value;
    const to = document.getElementById('chart-to').value;
    const period = parseInt(document.getElementById('chart-period').value);

    fetchChartData(from, to, period);
}

function fetchChartData(from, to, period) {
    // Simulate historical data based on current rate
    const baseRate = exchangeRates[to] || 1;
    const labels = [];
    const data = [];

    for (let i = period; i > 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString());

        // Simulate random fluctuations
        const fluctuation = (Math.random() - 0.5) * 0.1;
        data.push(baseRate * (1 + fluctuation));
    }

    renderChart(labels, data, from, to);
}

function renderChart(labels, data, from, to) {
    const ctx = document.getElementById('exchange-chart').getContext('2d');

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${from} to ${to}`,
                data: data,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#00d4ff',
                pointBorderColor: '#ffffff',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#b0b0b0',
                        font: { size: 12 }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(0, 212, 255, 0.1)' },
                    ticks: { color: '#b0b0b0' }
                },
                y: {
                    grid: { color: 'rgba(0, 212, 255, 0.1)' },
                    ticks: { color: '#b0b0b0' }
                }
            }
        }
    });
}

// ============= UTILITIES =============
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #00f5a0;
        color: #000;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

console.log('Advanced Currency Converter loaded successfully');
