const form = document.getElementById("transactionForm");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");
const transactionList = document.getElementById("transactionList");

const themeBtn = document.getElementById("themeBtn");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let expenseChart;

dateInput.valueAsDate = new Date();

function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function formatMoney(amount) {
  return `RM ${Number(amount).toFixed(2)}`;
}

function addTransaction(e) {
  e.preventDefault();

  const transaction = {
    id: Date.now(),
    title: titleInput.value.trim(),
    amount: Number(amountInput.value),
    type: typeInput.value,
    category: categoryInput.value,
    date: dateInput.value
  };

  if (!transaction.title || transaction.amount <= 0 || !transaction.date) {
    alert("Please fill in all fields correctly.");
    return;
  }

  transactions.push(transaction);
  saveTransactions();
  form.reset();
  dateInput.valueAsDate = new Date();

  renderTransactions();
  updateSummary();
  updateChart();
}

function deleteTransaction(id) {
  transactions = transactions.filter(transaction => transaction.id !== id);
  saveTransactions();
  renderTransactions();
  updateSummary();
  updateChart();
}

function clearAllTransactions() {
  if (transactions.length === 0) {
    alert("No transactions to clear.");
    return;
  }

  const confirmClear = confirm("Are you sure you want to clear all transactions?");

  if (confirmClear) {
    transactions = [];
    saveTransactions();
    renderTransactions();
    updateSummary();
    updateChart();
  }
}

function renderTransactions() {
  transactionList.innerHTML = "";

  if (transactions.length === 0) {
    transactionList.innerHTML = `<p class="empty">No transactions added yet.</p>`;
    return;
  }

  const sortedTransactions = [...transactions].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  sortedTransactions.forEach(transaction => {
    const item = document.createElement("div");
    item.classList.add("transaction-item");

    const sign = transaction.type === "income" ? "+" : "-";
    const amountClass = transaction.type === "income" ? "amount-income" : "amount-expense";

    item.innerHTML = `
      <div class="transaction-info">
        <h3>${transaction.title}</h3>
        <p>${transaction.category} • ${transaction.date}</p>
      </div>

      <div class="transaction-amount">
        <p class="${amountClass}">${sign} ${formatMoney(transaction.amount)}</p>
        <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">Delete</button>
      </div>
    `;

    transactionList.appendChild(item);
  });
}

function updateSummary() {
  const income = transactions
    .filter(transaction => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const expense = transactions
    .filter(transaction => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const balance = income - expense;

  incomeEl.textContent = formatMoney(income);
  expenseEl.textContent = formatMoney(expense);
  balanceEl.textContent = formatMoney(balance);
}

function getExpenseCategoryData() {
  const expenseTransactions = transactions.filter(transaction => transaction.type === "expense");

  const categoryTotals = {};

  expenseTransactions.forEach(transaction => {
    if (!categoryTotals[transaction.category]) {
      categoryTotals[transaction.category] = 0;
    }

    categoryTotals[transaction.category] += transaction.amount;
  });

  return categoryTotals;
}

function updateChart() {
  const ctx = document.getElementById("expenseChart").getContext("2d");
  const categoryTotals = getExpenseCategoryData();

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (expenseChart) {
    expenseChart.destroy();
  }

  expenseChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels.length ? labels : ["No Expense"],
      datasets: [
        {
          data: data.length ? data : [1],
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

function exportCSV() {
  if (transactions.length === 0) {
    alert("No transactions to export.");
    return;
  }

  let csv = "Title,Amount,Type,Category,Date\n";

  transactions.forEach(transaction => {
    csv += `"${transaction.title}",${transaction.amount},${transaction.type},${transaction.category},${transaction.date}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "expense-transactions.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme");

  if (currentTheme === "light") {
    html.setAttribute("data-theme", "dark");
    themeBtn.textContent = "☀️ Light Mode";
    localStorage.setItem("theme", "dark");
  } else {
    html.setAttribute("data-theme", "light");
    themeBtn.textContent = "🌙 Dark Mode";
    localStorage.setItem("theme", "light");
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";

  document.documentElement.setAttribute("data-theme", savedTheme);

  if (savedTheme === "dark") {
    themeBtn.textContent = "☀️ Light Mode";
  } else {
    themeBtn.textContent = "🌙 Dark Mode";
  }
}

form.addEventListener("submit", addTransaction);
themeBtn.addEventListener("click", toggleTheme);
exportBtn.addEventListener("click", exportCSV);
clearBtn.addEventListener("click", clearAllTransactions);

loadTheme();
renderTransactions();
updateSummary();
updateChart();
