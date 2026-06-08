// Local-First Expense Optimization System
const ExpenseAnalytics = {
    categories: { Investment: 0, Production: 0, Utilities: 0, Overheads: 0 },
    monthlyBudget: 10000,

    init() {
        const savedData = localStorage.getItem('rik_fintech_analytics');
        if (savedData) {
            this.categories = JSON.parse(savedData);
        }
        this.evaluatePatterns();
    },

    addExpense(category, amount) {
        if (this.categories[category] !== undefined) {
            this.categories[category] += parseFloat(amount);
            localStorage.setItem('rik_fintech_analytics', JSON.stringify(this.categories));
            this.evaluatePatterns();
        }
    },

    evaluatePatterns() {
        const totalSpent = Object.values(this.categories).reduce((a, b) => a + b, 0);
        const burnRate = ((totalSpent / this.monthlyBudget) * 100).toFixed(1);

        let advice = "Financial structure optimized locally.";
        if (this.categories.Overheads > (this.monthlyBudget * 0.20)) {
            advice = "Alert: Overheads exceeding 20% limit. Resource reallocation recommended.";
        } else if (this.categories.Investment > (this.monthlyBudget * 0.40)) {
            advice = "Strategy: High capital reinvestment pattern detected.";
        }

        this.renderTelemetryUI(totalSpent, burnRate, advice);
    },

    renderTelemetryUI(total, burn, message) {
        document.getElementById('total-spent').innerText = `₹${total}`;
        document.getElementById('burn-rate').innerText = `${burn}%`;
        document.getElementById('financial-advice').innerText = message;
    }
};

// Start local analytics loop
ExpenseAnalytics.init();
