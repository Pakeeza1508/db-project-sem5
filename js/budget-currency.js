// Budget Search Currency Converter - Fetches rates from MongoDB
let budgetCurrentCurrency = 'PKR'; // Default to PKR for Pakistan
let budgetExchangeRates = {};
let destinationsCostsUSD = {}; // Store original USD costs for each destination

// Fetch exchange rates from database (MongoDB via Netlify Function)
async function fetchBudgetExchangeRates() {
    try {
        // Try to fetch from our database first
        const response = await fetch('/.netlify/functions/getExchangeRates');
        const data = await response.json();
        
        if (data.success && data.rates) {
            budgetExchangeRates = data.rates;
            console.log('Exchange rates loaded from database:', budgetExchangeRates);
            return;
        }
    } catch (error) {
        console.error('Failed to fetch exchange rates from database:', error);
    }

    // Fallback: Try external API
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        budgetExchangeRates = data.rates;
        console.log('Exchange rates loaded from external API:', budgetExchangeRates);
        return;
    } catch (error) {
        console.error('Failed to fetch from external API:', error);
    }

    // Final fallback: Use hardcoded rates
    console.warn('Using fallback hardcoded exchange rates');
    budgetExchangeRates = {
        USD: 1,
        PKR: 278.50,
        INR: 83.12,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.50,
        AUD: 1.53,
        CAD: 1.36,
        CHF: 0.88,
        CNY: 7.24,
        AED: 3.67,
        SAR: 3.75,
        QAR: 3.64,
        BDT: 110.50,
        SGD: 1.35,
        MYR: 4.70,
        THB: 36.20
    };
}

// Currency symbols
const budgetCurrencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF ',
    CNY: '¥',
    AED: 'AED ',
    PKR: '₨',
    SAR: 'SAR ',
    QAR: 'QAR '
};

// Convert amount from USD to target currency
function convertBudgetCurrency(usdAmount, targetCurrency = budgetCurrentCurrency) {
    if (!budgetExchangeRates[targetCurrency]) return usdAmount;
    const rate = budgetExchangeRates[targetCurrency];
    const converted = usdAmount * rate;

    // Format based on currency
    if (targetCurrency === 'JPY' || targetCurrency === 'INR' || targetCurrency === 'PKR') {
        return Math.round(converted); // No decimals for these
    }
    return Math.round(converted * 100) / 100; // 2 decimals for others
}

// Format currency display
function formatBudgetCurrency(amount, currency = budgetCurrentCurrency) {
    const symbol = budgetCurrencySymbols[currency] || currency + ' ';

    if (currency === 'JPY' || currency === 'INR' || currency === 'PKR') {
        return `${symbol}${Math.round(amount).toLocaleString()}`;
    }
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Add currency selector to results section
function addBudgetCurrencySelector() {
    const resultsTitle = document.querySelector('.results-title');
    if (resultsTitle && !document.getElementById('budget-currency-selector')) {
        const selectorDiv = document.createElement('div');
        selectorDiv.id = 'budget-currency-selector';
        selectorDiv.style.cssText = 'margin-top: 20px; text-align: center;';
        selectorDiv.innerHTML = `
            <label for="budget-currency-select" style="color: var(--text-muted); font-size: 0.95rem; margin-right: 10px;">
                <i class="fa-solid fa-coins"></i> Display Currency:
            </label>
            <select id="budget-currency-select" style="
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: var(--text);
                cursor: pointer;
                font-family: inherit;
            ">
                <option value="PKR" selected>PKR (₨)</option>
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="CHF">CHF</option>
                <option value="CNY">CNY (¥)</option>
                <option value="AED">AED</option>
                <option value="SAR">SAR</option>
                <option value="QAR">QAR</option>
            </select>
        `;
        resultsTitle.appendChild(selectorDiv);

        // Add event listener
        document.getElementById('budget-currency-select').addEventListener('change', (e) => {
            updateBudgetDisplayCurrency(e.target.value);
        });
    }
}

// Update all destination card costs to selected currency
function updateBudgetDisplayCurrency(currency) {
    budgetCurrentCurrency = currency;
    console.log(`Converting budget search costs to ${currency}`);

    // Update all destination cards
    const cards = document.querySelectorAll('.destination-card');
    cards.forEach((card) => {
        // Find all package costs in this card
        const packageOptions = card.querySelectorAll('.package-option');
        packageOptions.forEach((option) => {
            const costElement = option.querySelector('.package-cost');
            const originalUSD = parseFloat(costElement.getAttribute('data-usd-cost') || 0);
            
            if (originalUSD > 0) {
                const converted = convertBudgetCurrency(originalUSD, currency);
                costElement.textContent = formatBudgetCurrency(converted, currency);
            }
        });

        // Update travel time info if it has a cost component
        const travelInfo = card.querySelector('.destination-info-value');
        if (travelInfo) {
            // Update any costs shown in attractions or info
            const costElements = card.querySelectorAll('[data-usd-cost]');
            costElements.forEach((elem) => {
                const originalUSD = parseFloat(elem.getAttribute('data-usd-cost') || 0);
                if (originalUSD > 0) {
                    const converted = convertBudgetCurrency(originalUSD, currency);
                    elem.textContent = formatBudgetCurrency(converted, currency);
                }
            });
        }
    });

    // Update results heading with currency
    const resultsHeading = document.getElementById('results-heading');
    if (resultsHeading) {
        const budgetInput = document.getElementById('total-budget').value;
        const originalHeading = resultsHeading.textContent;
        // Extract just the budget number and re-format it
        const budgetMatch = originalHeading.match(/(\d+(?:,\d{3})*)/);
        if (budgetMatch) {
            const budgetPKR = parseInt(budgetMatch[1].replace(/,/g, ''));
            // Convert PKR to selected currency (assume input is in PKR)
            const budgetInUSD = budgetPKR / budgetExchangeRates['PKR'];
            const converted = convertBudgetCurrency(budgetInUSD, currency);
            resultsHeading.innerHTML = `Top 3 Destinations for ${formatBudgetCurrency(converted, currency)}`;
        }
    }
}

// Initialize budget currency converter after results are displayed
function initBudgetCurrencyConverter() {
    // Fetch rates if not already loaded
    if (Object.keys(budgetExchangeRates).length === 0) {
        fetchBudgetExchangeRates().then(() => {
            addBudgetCurrencySelector();
        });
    } else {
        addBudgetCurrencySelector();
    }
}

// Make it globally available for budget-search.js
window.initBudgetCurrencyConverter = initBudgetCurrencyConverter;
window.formatBudgetCurrency = formatBudgetCurrency;
window.convertBudgetCurrency = convertBudgetCurrency;
window.destinationsCostsUSD = destinationsCostsUSD;
