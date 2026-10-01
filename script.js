/* =========================================================
   PERSONAL FINANCE TRACKER - VERSION 3
   LocalStorage + JSON Backup + Chart.js
========================================================= */

/* =========================================================
   STORAGE KEYS
========================================================= */

const TRANSACTION_STORAGE_KEY = "personalFinanceTrackerData";
const CATEGORY_STORAGE_KEY = "financeTrackerCategories";
const BACKUP_STORAGE_KEY = "financeTrackerLastBackup";

/* =========================================================
   DEFAULT CATEGORIES
========================================================= */

const DEFAULT_CATEGORIES = [
  "Food",
  "Transport",
  "Bills",
  "Shopping",
  "Health",
  "Education",
  "Entertainment",
  "Household",
  "Personal",
  "Other",
];

/* =========================================================
   APPLICATION STATE
========================================================= */

let transactions = [];
let categories = [];

let selectedMonth = "";

let currentDeleteId = null;

let incomeExpenseChart = null;
let categoryChart = null;
let dailySpendingChart = null;

let monthlyComparisonChart = null;
let paymentMethodChart = null;
let weekdayChart = null;

let toastTimer = null;

/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  loadData();

  initializeMonth();

  initializeDates();

  setupNavigation();

  setupModalEvents();

  setupForms();

  setupFilters();

  setupButtons();

  setupCategoryManager();

  setupMobileMenu();

  populateCategoryDropdowns();

  updateAll();
});

/* =========================================================
   LOAD DATA
========================================================= */

function loadData() {
  try {
    const savedTransactions = localStorage.getItem(TRANSACTION_STORAGE_KEY);

    const savedCategories = localStorage.getItem(CATEGORY_STORAGE_KEY);

    transactions = savedTransactions ? JSON.parse(savedTransactions) : [];

    categories = savedCategories
      ? JSON.parse(savedCategories)
      : [...DEFAULT_CATEGORIES];
  } catch (error) {
    console.error("Failed to load data:", error);

    transactions = [];

    categories = [...DEFAULT_CATEGORIES];

    showToast("Could not load saved data.");
  }

  if (!Array.isArray(transactions)) {
    transactions = [];
  }

  if (!Array.isArray(categories) || categories.length === 0) {
    categories = [...DEFAULT_CATEGORIES];
  }

  transactions = transactions.map(normalizeTransaction);

  saveData();
}

/* =========================================================
   NORMALIZE TRANSACTION
   Keeps V1/V2 data compatible
========================================================= */

function normalizeTransaction(transaction) {
  return {
    id: transaction.id || generateId(),

    type: transaction.type === "expense" ? "expense" : "income",

    date: transaction.date || getTodayDate(),

    amount: Number(transaction.amount) || 0,

    description: transaction.description || "Untitled",

    category:
      transaction.category ||
      (transaction.type === "expense" ? "Other" : "Income"),

    notes: transaction.notes || "",

    vendor: transaction.vendor || transaction.personVendor || "",

    paymentMethod: transaction.paymentMethod || "Cash",

    createdAt: transaction.createdAt || new Date().toISOString(),
  };
}

/* =========================================================
   SAVE DATA
========================================================= */

function saveData() {
  localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(transactions));

  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
}

/* =========================================================
   ID
========================================================= */

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/* =========================================================
   DATE HELPERS
========================================================= */

function getTodayDate() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentMonth() {
  const now = new Date();

  return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
}

function initializeMonth() {
  selectedMonth = getCurrentMonth();

  const picker = document.getElementById("monthPicker");

  picker.value = selectedMonth;

  picker.addEventListener("change", () => {
    selectedMonth = picker.value;

    updateAll();
  });
}

function initializeDates() {
  const today = getTodayDate();

  document.getElementById("incomeDate").value = today;

  document.getElementById("expenseDate").value = today;
}

/* =========================================================
   MONTH NAVIGATION
========================================================= */

document.getElementById("previousMonthBtn").addEventListener("click", () => {
  selectedMonth = shiftMonth(selectedMonth, -1);

  document.getElementById("monthPicker").value = selectedMonth;

  updateAll();
});

document.getElementById("nextMonthBtn").addEventListener("click", () => {
  selectedMonth = shiftMonth(selectedMonth, 1);

  document.getElementById("monthPicker").value = selectedMonth;

  updateAll();
});

function shiftMonth(month, amount) {
  const [year, monthNumber] = month.split("-").map(Number);

  const date = new Date(year, monthNumber - 1 + amount, 1);

  return (
    date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0")
  );
}

/* =========================================================
   MONTH DATA
========================================================= */

function getMonthTransactions(month = selectedMonth) {
  return transactions.filter(
    (transaction) => transaction.date && transaction.date.startsWith(month),
  );
}

function getPreviousMonth() {
  return shiftMonth(selectedMonth, -1);
}

function getPreviousMonthTransactions() {
  return getMonthTransactions(getPreviousMonth());
}

/* =========================================================
   TOTALS
========================================================= */

function getIncomeTotal(items) {
  return items
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);
}

function getExpenseTotal(items) {
  return items
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);
}

/* =========================================================
   FORMATTERS
========================================================= */

function formatCurrency(amount) {
  return (
    "Rs. " +
    Number(amount || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  );
}

function formatDate(dateString) {
  if (!dateString) {
    return "—";
  }

  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMonth(monthString) {
  if (!monthString) {
    return "";
  }

  const [year, month] = monthString.split("-").map(Number);

  const date = new Date(year, month - 1, 1);

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const page = item.dataset.page;

      switchPage(page);
    });
  });

  document
    .getElementById("viewAllTransactions")
    .addEventListener("click", () => {
      switchPage("transactions");
    });
}

function switchPage(page) {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.page === page);
  });

  document.querySelectorAll(".page-section").forEach((section) => {
    section.classList.remove("active");
  });

  const pageElement = document.getElementById(page + "Page");

  if (pageElement) {
    pageElement.classList.add("active");
  }

  const pageData = {
    dashboard: {
      title: "Dashboard",
      subtitle: "Overview of your finances",
    },

    transactions: {
      title: "Transactions",
      subtitle: "View and manage your transactions",
    },

    analytics: {
      title: "Analytics",
      subtitle: "Detailed insights into your spending",
    },

    backup: {
      title: "Data & Backup",
      subtitle: "Manage and protect your finance data",
    },
  };

  if (pageData[page]) {
    document.getElementById("pageTitle").textContent = pageData[page].title;

    document.getElementById("pageSubtitle").textContent =
      pageData[page].subtitle;
  }

  closeMobileMenu();
}

/* =========================================================
   MODAL SETUP
========================================================= */

function setupModalEvents() {
  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => {
      closeModal(button.dataset.close);
    });
  });

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        overlay.classList.remove("active");
      }
    });
  });
}

function openModal(id) {
  document.getElementById(id).classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

/* =========================================================
   FORM SETUP
========================================================= */

function setupForms() {
  document.getElementById("incomeForm").addEventListener("submit", addIncome);

  document.getElementById("expenseForm").addEventListener("submit", addExpense);

  document
    .getElementById("editForm")
    .addEventListener("submit", saveEditedTransaction);
}

/* =========================================================
   BUTTONS
========================================================= */

function setupButtons() {
  document
    .getElementById("dashboardAddIncome")
    .addEventListener("click", () => openIncomeModal());

  document
    .getElementById("dashboardAddExpense")
    .addEventListener("click", () => openExpenseModal());

  document
    .getElementById("transactionAddIncome")
    .addEventListener("click", () => openIncomeModal());

  document
    .getElementById("transactionAddExpense")
    .addEventListener("click", () => openExpenseModal());

  document
    .getElementById("confirmDeleteBtn")
    .addEventListener("click", confirmDelete);

  document
    .getElementById("clearDataBtn")
    .addEventListener("click", () => openModal("clearModal"));

  document
    .getElementById("confirmClearBtn")
    .addEventListener("click", clearAllTransactions);

  document.getElementById("exportBtn").addEventListener("click", exportBackup);

  document.getElementById("importBtn").addEventListener("click", () => {
    document.getElementById("importFile").click();
  });

  document
    .getElementById("importFile")
    .addEventListener("change", importBackup);
}

/* =========================================================
   OPEN INCOME MODAL
========================================================= */

function openIncomeModal() {
  document.getElementById("incomeForm").reset();

  document.getElementById("incomeDate").value = getTodayDate();

  document.getElementById("incomePaymentMethod").value = "Cash";

  openModal("incomeModal");
}

/* =========================================================
   OPEN EXPENSE MODAL
========================================================= */

function openExpenseModal() {
  document.getElementById("expenseForm").reset();

  document.getElementById("expenseDate").value = getTodayDate();

  document.getElementById("expensePaymentMethod").value = "Cash";

  populateCategoryDropdowns();

  openModal("expenseModal");
}

/* =========================================================
   ADD INCOME
========================================================= */

function addIncome(event) {
  event.preventDefault();

  const amount = Number(document.getElementById("incomeAmount").value);

  if (!amount || amount <= 0) {
    showToast("Please enter a valid amount.");

    return;
  }

  const transaction = {
    id: generateId(),

    type: "income",

    date: document.getElementById("incomeDate").value,

    amount: amount,

    description: document.getElementById("incomeDescription").value.trim(),

    category: "Income",

    vendor: document.getElementById("incomeVendor").value.trim(),

    paymentMethod: document.getElementById("incomePaymentMethod").value,

    notes: document.getElementById("incomeNotes").value.trim(),

    createdAt: new Date().toISOString(),
  };

  transactions.push(transaction);

  saveData();

  closeModal("incomeModal");

  updateAll();

  showToast("Withdrawal added successfully.");
}

/* =========================================================
   ADD EXPENSE
========================================================= */

function addExpense(event) {
  event.preventDefault();

  const amount = Number(document.getElementById("expenseAmount").value);

  if (!amount || amount <= 0) {
    showToast("Please enter a valid amount.");

    return;
  }

  const transaction = {
    id: generateId(),

    type: "expense",

    date: document.getElementById("expenseDate").value,

    amount: amount,

    description: document.getElementById("expenseDescription").value.trim(),

    category: document.getElementById("expenseCategory").value,

    vendor: document.getElementById("expenseVendor").value.trim(),

    paymentMethod: document.getElementById("expensePaymentMethod").value,

    notes: document.getElementById("expenseNotes").value.trim(),

    createdAt: new Date().toISOString(),
  };

  transactions.push(transaction);

  saveData();

  closeModal("expenseModal");

  updateAll();

  showToast("Expense added successfully.");
}

/* =========================================================
   UPDATE EVERYTHING
========================================================= */

function updateAll() {
  updatePageSubtitle();

  populateCategoryDropdowns();

  updateDashboard();

  updateTransactionsPage();

  updateAnalytics();

  updateBackupPage();

  updateCategoryManager();

  renderCharts();
}

/* =========================================================
   PAGE SUBTITLE
========================================================= */

function updatePageSubtitle() {
  const activePage = document.querySelector(".page-section.active");

  if (!activePage) {
    return;
  }

  if (activePage.id === "dashboardPage") {
    document.getElementById("pageSubtitle").textContent =
      `${formatMonth(selectedMonth)} financial overview`;
  }
}

/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {
  const monthTransactions = getMonthTransactions();

  const previousTransactions = getPreviousMonthTransactions();

  const income = getIncomeTotal(monthTransactions);

  const expenses = getExpenseTotal(monthTransactions);

  const previousIncome = getIncomeTotal(previousTransactions);

  const previousExpenses = getExpenseTotal(previousTransactions);

  const balance = income - expenses;

  document.getElementById("totalIncome").textContent = formatCurrency(income);

  document.getElementById("totalExpenses").textContent =
    formatCurrency(expenses);

  document.getElementById("remainingBalance").textContent =
    formatCurrency(balance);

  document.getElementById("transactionCount").textContent =
    monthTransactions.length;

  document.getElementById("incomeComparison").textContent = comparisonText(
    income,
    previousIncome,
  );

  document.getElementById("expenseComparison").textContent = comparisonText(
    expenses,
    previousExpenses,
  );

  document.getElementById("balanceComparison").textContent =
    `Balance for ${formatMonth(selectedMonth)}`;

  document.getElementById("transactionComparison").textContent =
    `Transactions in ${formatMonth(selectedMonth)}`;

  const average = calculateAverageDailySpending(monthTransactions);

  document.getElementById("averageDailySpending").textContent =
    formatCurrency(average);

  const highest = getHighestExpense(monthTransactions);

  document.getElementById("highestExpense").textContent = highest
    ? formatCurrency(highest.amount)
    : "Rs. 0";

  const topCategory = getTopCategory(monthTransactions);

  document.getElementById("topCategory").textContent = topCategory
    ? topCategory.name
    : "—";

  const topVendor = getTopVendor(monthTransactions);

  document.getElementById("topVendor").textContent = topVendor
    ? topVendor.name
    : "—";

  renderRecentTransactions(monthTransactions);
}

/* =========================================================
   COMPARISON TEXT
========================================================= */

function comparisonText(current, previous) {
  if (previous === 0 && current === 0) {
    return "No activity";
  }

  if (previous === 0) {
    return "No previous month activity";
  }

  const difference = current - previous;

  const percentage = Math.abs((difference / previous) * 100).toFixed(1);

  if (difference > 0) {
    return `↑ ${percentage}% from previous month`;
  }

  if (difference < 0) {
    return `↓ ${percentage}% from previous month`;
  }

  return "Same as previous month";
}

/* =========================================================
   AVERAGE DAILY SPENDING
========================================================= */

function calculateAverageDailySpending(items) {
  const expenses = items.filter((item) => item.type === "expense");

  if (expenses.length === 0) {
    return 0;
  }

  const total = getExpenseTotal(items);

  const uniqueDays = new Set(expenses.map((item) => item.date)).size;

  return uniqueDays > 0 ? total / uniqueDays : 0;
}

/* =========================================================
   HIGHEST EXPENSE
========================================================= */

function getHighestExpense(items) {
  const expenses = items.filter((item) => item.type === "expense");

  if (expenses.length === 0) {
    return null;
  }

  return expenses.reduce((highest, current) =>
    current.amount > highest.amount ? current : highest,
  );
}

/* =========================================================
   TOP CATEGORY
========================================================= */

function getTopCategory(items) {
  const totals = {};

  items
    .filter((item) => item.type === "expense")
    .forEach((item) => {
      const category = item.category || "Other";

      totals[category] = (totals[category] || 0) + Number(item.amount);
    });

  const entries = Object.entries(totals);

  if (entries.length === 0) {
    return null;
  }

  entries.sort((a, b) => b[1] - a[1]);

  return {
    name: entries[0][0],
    amount: entries[0][1],
  };
}

/* =========================================================
   TOP VENDOR
========================================================= */

function getTopVendor(items) {
  const totals = {};

  items
    .filter(
      (item) => item.type === "expense" && item.vendor && item.vendor.trim(),
    )
    .forEach((item) => {
      const vendor = item.vendor.trim();

      totals[vendor] = (totals[vendor] || 0) + Number(item.amount);
    });

  const entries = Object.entries(totals);

  if (entries.length === 0) {
    return null;
  }

  entries.sort((a, b) => b[1] - a[1]);

  return {
    name: entries[0][0],
    amount: entries[0][1],
  };
}

/* =========================================================
   RECENT TRANSACTIONS
========================================================= */

function renderRecentTransactions(items) {
  const body = document.getElementById("recentTransactionsBody");

  const empty = document.getElementById("recentEmptyState");

  const wrapper = document.getElementById("recentTableWrapper");

  const sorted = [...items]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 7);

  if (sorted.length === 0) {
    empty.style.display = "block";

    wrapper.style.display = "none";

    body.innerHTML = "";

    return;
  }

  empty.style.display = "none";

  wrapper.style.display = "block";

  body.innerHTML = sorted
    .map((transaction) => {
      const isIncome = transaction.type === "income";

      return `

                <tr>

                    <td>
                        ${formatDate(transaction.date)}
                    </td>

                    <td>
                        <span class="type-badge ${
                          isIncome ? "type-income" : "type-expense"
                        }">
                            ${isIncome ? "Withdrawal" : "Expense"}
                        </span>
                    </td>

                    <td>
                        ${escapeHTML(transaction.description)}
                    </td>

                    <td>
                        <span class="category-badge">
                            ${escapeHTML(transaction.category)}
                        </span>
                    </td>

                    <td class="vendor-cell">
                        ${
                          transaction.vendor
                            ? escapeHTML(transaction.vendor)
                            : "—"
                        }
                    </td>

                    <td class="${
                      isIncome ? "amount-income" : "amount-expense"
                    }">
                        ${isIncome ? "+" : "-"}
                        ${formatCurrency(transaction.amount)}
                    </td>

                </tr>

            `;
    })
    .join("");
}

/* =========================================================
   TRANSACTIONS PAGE
========================================================= */

function setupFilters() {
  document
    .getElementById("searchInput")
    .addEventListener("input", updateTransactionsPage);

  document
    .getElementById("typeFilter")
    .addEventListener("change", updateTransactionsPage);

  document
    .getElementById("categoryFilter")
    .addEventListener("change", updateTransactionsPage);

  document
    .getElementById("paymentFilter")
    .addEventListener("change", updateTransactionsPage);

  document
    .getElementById("clearFilters")
    .addEventListener("click", clearFilters);
}

function clearFilters() {
  document.getElementById("searchInput").value = "";

  document.getElementById("typeFilter").value = "all";

  document.getElementById("categoryFilter").value = "all";

  document.getElementById("paymentFilter").value = "all";

  updateTransactionsPage();

  showToast("Filters cleared.");
}

function getFilteredTransactions() {
  const monthItems = getMonthTransactions();

  const search = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  const type = document.getElementById("typeFilter").value;

  const category = document.getElementById("categoryFilter").value;

  const payment = document.getElementById("paymentFilter").value;

  return monthItems.filter((transaction) => {
    const matchesSearch =
      !search ||
      transaction.description.toLowerCase().includes(search) ||
      transaction.vendor.toLowerCase().includes(search) ||
      transaction.notes.toLowerCase().includes(search);

    const matchesType = type === "all" || transaction.type === type;

    const matchesCategory =
      category === "all" || transaction.category === category;

    const matchesPayment =
      payment === "all" || transaction.paymentMethod === payment;

    return matchesSearch && matchesType && matchesCategory && matchesPayment;
  });
}

function updateTransactionsPage() {
  const items = getFilteredTransactions();

  const body = document.getElementById("transactionsBody");

  const empty = document.getElementById("transactionsEmptyState");

  const wrapper = document.getElementById("transactionsTableWrapper");

  document.getElementById("transactionTableTitle").textContent =
    formatMonth(selectedMonth);

  document.getElementById("filteredTransactionCount").textContent =
    `${items.length} ${items.length === 1 ? "transaction" : "transactions"}`;

  if (items.length === 0) {
    empty.style.display = "block";

    wrapper.style.display = "none";

    body.innerHTML = "";

    return;
  }

  empty.style.display = "none";

  wrapper.style.display = "block";

  const sorted = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));

  body.innerHTML = sorted
    .map((transaction) => {
      const isIncome = transaction.type === "income";

      return `

                <tr>

                    <td>
                        ${formatDate(transaction.date)}
                    </td>

                    <td>
                        <span class="type-badge ${
                          isIncome ? "type-income" : "type-expense"
                        }">
                            ${isIncome ? "Withdrawal" : "Expense"}
                        </span>
                    </td>

                    <td>
                        <strong>
                            ${escapeHTML(transaction.description)}
                        </strong>
                    </td>

                    <td>
                        <span class="category-badge">
                            ${escapeHTML(transaction.category)}
                        </span>
                    </td>

                    <td class="vendor-cell">
                        ${
                          transaction.vendor
                            ? escapeHTML(transaction.vendor)
                            : "—"
                        }
                    </td>

                    <td>
                        <span class="payment-badge">
                            ${escapeHTML(transaction.paymentMethod)}
                        </span>
                    </td>

                    <td class="${
                      isIncome ? "amount-income" : "amount-expense"
                    }">

                        ${isIncome ? "+" : "-"}

                        ${formatCurrency(transaction.amount)}

                    </td>

                    <td>
                        ${
                          transaction.notes
                            ? escapeHTML(transaction.notes)
                            : "—"
                        }
                    </td>

                    <td>

                        <div class="action-buttons">

                            <button
                                class="table-action"
                                title="Edit"
                                onclick="openEditModal('${transaction.id}')"
                            >
                                ✎
                            </button>

                            <button
                                class="table-action delete"
                                title="Delete"
                                onclick="openDeleteModal('${transaction.id}')"
                            >
                                ×
                            </button>

                        </div>

                    </td>

                </tr>

            `;
    })
    .join("");
}

/* =========================================================
   EDIT TRANSACTION
========================================================= */

function openEditModal(id) {
  const transaction = transactions.find((item) => item.id === id);

  if (!transaction) {
    return;
  }

  document.getElementById("editId").value = transaction.id;

  document.getElementById("editType").value = transaction.type;

  document.getElementById("editDate").value = transaction.date;

  document.getElementById("editAmount").value = transaction.amount;

  document.getElementById("editDescription").value = transaction.description;

  document.getElementById("editCategory").value = transaction.category;

  document.getElementById("editVendor").value = transaction.vendor || "";

  document.getElementById("editPaymentMethod").value =
    transaction.paymentMethod || "Cash";

  document.getElementById("editNotes").value = transaction.notes || "";

  updateEditCategoryState();

  openModal("editModal");
}

document
  .getElementById("editType")
  .addEventListener("change", updateEditCategoryState);

function updateEditCategoryState() {
  const type = document.getElementById("editType").value;

  const category = document.getElementById("editCategory");

  if (type === "income") {
    category.innerHTML = `<option value="Income">Income</option>`;

    category.value = "Income";

    return;
  }

  category.innerHTML = categories
    .map((categoryName) => {
      return `
                <option value="${escapeHTML(categoryName)}">
                    ${escapeHTML(categoryName)}
                </option>
            `;
    })
    .join("");
}

function saveEditedTransaction(event) {
  event.preventDefault();

  const id = document.getElementById("editId").value;

  const index = transactions.findIndex((item) => item.id === id);

  if (index === -1) {
    showToast("Transaction not found.");
    return;
  }

  const amount = Number(document.getElementById("editAmount").value);

  if (!amount || amount <= 0) {
    showToast("Please enter a valid amount.");

    return;
  }

  const type = document.getElementById("editType").value;

  transactions[index] = {
    ...transactions[index],

    type: type,

    date: document.getElementById("editDate").value,

    amount: amount,

    description: document.getElementById("editDescription").value.trim(),

    category:
      type === "income"
        ? "Income"
        : document.getElementById("editCategory").value,

    vendor: document.getElementById("editVendor").value.trim(),

    paymentMethod: document.getElementById("editPaymentMethod").value,

    notes: document.getElementById("editNotes").value.trim(),
  };

  saveData();

  closeModal("editModal");

  updateAll();

  showToast("Transaction updated.");
}

/* =========================================================
   DELETE
========================================================= */

function openDeleteModal(id) {
  currentDeleteId = id;

  openModal("deleteModal");
}

function confirmDelete() {
  if (!currentDeleteId) {
    return;
  }

  transactions = transactions.filter(
    (transaction) => transaction.id !== currentDeleteId,
  );

  saveData();

  closeModal("deleteModal");

  currentDeleteId = null;

  updateAll();

  showToast("Transaction deleted.");
}

/* =========================================================
   CLEAR ALL
========================================================= */

function clearAllTransactions() {
  transactions = [];

  saveData();

  closeModal("clearModal");

  updateAll();

  showToast("All transactions cleared.");
}

/* =========================================================
   CATEGORY DROPDOWNS
========================================================= */

function populateCategoryDropdowns() {
  const expenseCategory = document.getElementById("expenseCategory");

  const categoryFilter = document.getElementById("categoryFilter");

  const editCategory = document.getElementById("editCategory");

  if (expenseCategory) {
    expenseCategory.innerHTML = categories
      .map((category) => {
        return `
                    <option value="${escapeHTML(category)}">
                        ${escapeHTML(category)}
                    </option>
                `;
      })
      .join("");
  }

  if (categoryFilter) {
    const current = categoryFilter.value || "all";

    categoryFilter.innerHTML = `
                <option value="all">
                    All Categories
                </option>

                ${categories
                  .map((category) => {
                    return `
                            <option value="${escapeHTML(category)}">
                                ${escapeHTML(category)}
                            </option>
                        `;
                  })
                  .join("")}
            `;

    if (
      [...categoryFilter.options].some((option) => option.value === current)
    ) {
      categoryFilter.value = current;
    }
  }

  if (editCategory) {
    updateEditCategoryState();
  }
}

/* =========================================================
   CATEGORY MANAGER
========================================================= */

function setupCategoryManager() {
  document
    .getElementById("addCategoryBtn")
    .addEventListener("click", addCategory);

  document
    .getElementById("newCategoryInput")
    .addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();

        addCategory();
      }
    });
}

function addCategory() {
  const input = document.getElementById("newCategoryInput");

  const value = input.value.trim();

  if (!value) {
    showToast("Enter a category name.");

    return;
  }

  const exists = categories.some(
    (category) => category.toLowerCase() === value.toLowerCase(),
  );

  if (exists) {
    showToast("That category already exists.");

    return;
  }

  categories.push(value);

  saveData();

  input.value = "";

  updateAll();

  showToast("Category added.");
}

function updateCategoryManager() {
  const container = document.getElementById("categoryList");

  container.innerHTML = categories
    .map((category) => {
      const canDelete = !DEFAULT_CATEGORIES.includes(category);

      return `

                <div class="category-item">

                    <span>
                        ${escapeHTML(category)}
                    </span>

                    ${
                      canDelete
                        ? `
                                <button
                                    class="remove-category"
                                    title="Delete category"
                                    onclick="removeCategory('${escapeHTML(category)}')"
                                >
                                    ×
                                </button>
                              `
                        : ""
                    }

                </div>

            `;
    })
    .join("");
}

function removeCategory(category) {
  const used = transactions.some(
    (transaction) => transaction.category === category,
  );

  if (used) {
    showToast("This category is being used by transactions.");

    return;
  }

  categories = categories.filter((item) => item !== category);

  saveData();

  updateAll();

  showToast("Category removed.");
}

/* =========================================================
   CHARTS
========================================================= */

function renderCharts() {
  renderIncomeExpenseChart();

  renderCategoryChart();

  renderDailySpendingChart();

  renderMonthlyComparisonChart();

  renderPaymentMethodChart();

  renderWeekdayChart();
}

/* =========================================================
   CHART DEFAULTS
========================================================= */

function chartDefaults() {
  return {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        labels: {
          color: "#9ca7b8",

          font: {
            size: 10,
          },
        },
      },
    },

    scales: {
      x: {
        ticks: {
          color: "#7f8a9d",
          font: {
            size: 9,
          },
        },

        grid: {
          color: "rgba(255,255,255,0.04)",
        },
      },

      y: {
        ticks: {
          color: "#7f8a9d",
          font: {
            size: 9,
          },
        },

        grid: {
          color: "rgba(255,255,255,0.04)",
        },
      },
    },
  };
}

/* =========================================================
   INCOME VS EXPENSE
========================================================= */

function renderIncomeExpenseChart() {
  const canvas = document.getElementById("incomeExpenseChart");

  if (!canvas) {
    return;
  }

  if (incomeExpenseChart) {
    incomeExpenseChart.destroy();
  }

  const items = getMonthTransactions();

  const income = getIncomeTotal(items);

  const expenses = getExpenseTotal(items);

  incomeExpenseChart = new Chart(canvas, {
    type: "bar",

    data: {
      labels: ["Withdrawals", "Expenses"],

      datasets: [
        {
          label: "Amount",

          data: [income, expenses],

          backgroundColor: ["rgba(34,197,94,0.75)", "rgba(239,68,68,0.75)"],

          borderColor: ["#22c55e", "#ef4444"],

          borderWidth: 1,

          borderRadius: 7,
        },
      ],
    },

    options: chartDefaults(),
  });
}

/* =========================================================
   CATEGORY CHART
========================================================= */

function renderCategoryChart() {
  const canvas = document.getElementById("categoryChart");

  if (!canvas) {
    return;
  }

  if (categoryChart) {
    categoryChart.destroy();
  }

  const totals = {};

  getMonthTransactions()
    .filter((item) => item.type === "expense")
    .forEach((item) => {
      const category = item.category || "Other";

      totals[category] = (totals[category] || 0) + Number(item.amount);
    });

  const labels = Object.keys(totals);

  const values = Object.values(totals);

  categoryChart = new Chart(canvas, {
    type: "doughnut",

    data: {
      labels: labels,

      datasets: [
        {
          data: values,

          backgroundColor: [
            "#3b82f6",
            "#22c55e",
            "#ef4444",
            "#f59e0b",
            "#8b5cf6",
            "#06b6d4",
            "#ec4899",
            "#84cc16",
            "#f97316",
            "#64748b",
          ],

          borderColor: "#111722",

          borderWidth: 3,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,

      plugins: {
        legend: {
          position: "bottom",

          labels: {
            color: "#9ca7b8",

            font: {
              size: 9,
            },

            padding: 12,
          },
        },
      },
    },
  });
}

/* =========================================================
   DAILY SPENDING
========================================================= */

function renderDailySpendingChart() {
  const canvas = document.getElementById("dailySpendingChart");

  if (!canvas) {
    return;
  }

  if (dailySpendingChart) {
    dailySpendingChart.destroy();
  }

  const [year, month] = selectedMonth.split("-").map(Number);

  const daysInMonth = new Date(year, month, 0).getDate();

  const labels = [];
  const values = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${selectedMonth}-${String(day).padStart(2, "0")}`;

    labels.push(day);

    const total = getMonthTransactions()
      .filter((item) => item.type === "expense" && item.date === date)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    values.push(total);
  }

  dailySpendingChart = new Chart(canvas, {
    type: "line",

    data: {
      labels: labels,

      datasets: [
        {
          label: "Daily Spending",

          data: values,

          borderColor: "#3b82f6",

          backgroundColor: "rgba(59,130,246,0.12)",

          fill: true,

          tension: 0.35,

          pointRadius: 2,

          pointBackgroundColor: "#3b82f6",
        },
      ],
    },

    options: chartDefaults(),
  });
}

/* =========================================================
   MONTHLY COMPARISON
========================================================= */

function renderMonthlyComparisonChart() {
  const canvas = document.getElementById("monthlyComparisonChart");

  if (!canvas) {
    return;
  }

  if (monthlyComparisonChart) {
    monthlyComparisonChart.destroy();
  }

  const current = getMonthTransactions();

  const previous = getPreviousMonthTransactions();

  monthlyComparisonChart = new Chart(canvas, {
    type: "bar",

    data: {
      labels: [formatMonth(getPreviousMonth()), formatMonth(selectedMonth)],

      datasets: [
        {
          label: "Withdrawals",

          data: [getIncomeTotal(previous), getIncomeTotal(current)],

          backgroundColor: "rgba(34,197,94,0.7)",

          borderColor: "#22c55e",

          borderWidth: 1,

          borderRadius: 7,
        },

        {
          label: "Expenses",

          data: [getExpenseTotal(previous), getExpenseTotal(current)],

          backgroundColor: "rgba(239,68,68,0.7)",

          borderColor: "#ef4444",

          borderWidth: 1,

          borderRadius: 7,
        },
      ],
    },

    options: chartDefaults(),
  });
}

/* =========================================================
   PAYMENT METHOD CHART
========================================================= */

function renderPaymentMethodChart() {
  const canvas = document.getElementById("paymentMethodChart");

  if (!canvas) {
    return;
  }

  if (paymentMethodChart) {
    paymentMethodChart.destroy();
  }

  const totals = {
    Cash: 0,
    Bank: 0,
    Card: 0,
    Online: 0,
  };

  getMonthTransactions()
    .filter((item) => item.type === "expense")
    .forEach((item) => {
      const method = item.paymentMethod || "Cash";

      if (Object.prototype.hasOwnProperty.call(totals, method)) {
        totals[method] += Number(item.amount);
      } else {
        totals[method] = (totals[method] || 0) + Number(item.amount);
      }
    });

  paymentMethodChart = new Chart(canvas, {
    type: "doughnut",

    data: {
      labels: Object.keys(totals),

      datasets: [
        {
          data: Object.values(totals),

          backgroundColor: ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6"],

          borderColor: "#111722",

          borderWidth: 3,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,

      plugins: {
        legend: {
          position: "bottom",

          labels: {
            color: "#9ca7b8",

            font: {
              size: 9,
            },

            padding: 12,
          },
        },
      },
    },
  });
}

/* =========================================================
   WEEKDAY CHART
========================================================= */

function renderWeekdayChart() {
  const canvas = document.getElementById("weekdayChart");

  if (!canvas) {
    return;
  }

  if (weekdayChart) {
    weekdayChart.destroy();
  }

  const weekdays = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  };

  getMonthTransactions()
    .filter((item) => item.type === "expense")
    .forEach((item) => {
      const date = new Date(item.date + "T00:00:00");

      const day = date.toLocaleDateString("en-US", {
        weekday: "long",
      });

      weekdays[day] += Number(item.amount);
    });

  weekdayChart = new Chart(canvas, {
    type: "bar",

    data: {
      labels: Object.keys(weekdays),

      datasets: [
        {
          label: "Spending",

          data: Object.values(weekdays),

          backgroundColor: "rgba(59,130,246,0.7)",

          borderColor: "#3b82f6",

          borderWidth: 1,

          borderRadius: 6,
        },
      ],
    },

    options: chartDefaults(),
  });
}

/* =========================================================
   ANALYTICS
========================================================= */

function updateAnalytics() {
  const current = getMonthTransactions();

  const previous = getPreviousMonthTransactions();

  const currentExpenses = getExpenseTotal(current);

  const previousExpenses = getExpenseTotal(previous);

  document.getElementById("previousMonthExpenses").textContent =
    formatCurrency(previousExpenses);

  let percentage = 0;

  if (previousExpenses !== 0) {
    percentage =
      ((currentExpenses - previousExpenses) / previousExpenses) * 100;
  }

  document.getElementById("expenseChangePercent").textContent =
    `${percentage >= 0 ? "+" : ""}${percentage.toFixed(1)}%`;

  document.getElementById("monthlyExpenseDifference").textContent =
    `${formatCurrency(
      Math.abs(currentExpenses - previousExpenses),
    )} difference`;

  const expenseTransactions = current.filter((item) => item.type === "expense");

  const average =
    expenseTransactions.length > 0
      ? currentExpenses / expenseTransactions.length
      : 0;

  document.getElementById("averageTransaction").textContent =
    formatCurrency(average);

  document.getElementById("expenseTransactionCount").textContent =
    expenseTransactions.length;

  renderVendorCards(current);
}

/* =========================================================
   VENDOR CARDS
========================================================= */

function renderVendorCards(items) {
  const container = document.getElementById("vendorGrid");

  const totals = {};

  const counts = {};

  items
    .filter(
      (item) => item.type === "expense" && item.vendor && item.vendor.trim(),
    )
    .forEach((item) => {
      const vendor = item.vendor.trim();

      totals[vendor] = (totals[vendor] || 0) + Number(item.amount);

      counts[vendor] = (counts[vendor] || 0) + 1;
    });

  const entries = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (entries.length === 0) {
    container.innerHTML = `

            <div class="empty-state"
                 style="grid-column: 1 / -1;">
                <div class="empty-icon">👤</div>

                <h3>No vendor information</h3>

                <p>
                    Add a Person / Vendor when recording
                    expenses to see this breakdown.
                </p>
            </div>

        `;

    return;
  }

  container.innerHTML = entries
    .map(([vendor, amount]) => {
      return `

                    <div class="vendor-card">

                        <div class="vendor-name">
                            ${escapeHTML(vendor)}
                        </div>

                        <div class="vendor-amount">
                            ${formatCurrency(amount)}
                        </div>

                        <div class="vendor-count">
                            ${counts[vendor]}
                            ${
                              counts[vendor] === 1
                                ? "transaction"
                                : "transactions"
                            }
                        </div>

                    </div>

                `;
    })
    .join("");
}

/* =========================================================
   BACKUP
========================================================= */

function exportBackup() {
  const backup = {
    app: "Personal Finance Tracker",

    version: "3.0",

    exportedAt: new Date().toISOString(),

    transactions: transactions,

    categories: categories,
  };

  const json = JSON.stringify(backup, null, 4);

  const blob = new Blob([json], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  const date = new Date().toISOString().slice(0, 10);

  link.href = url;

  link.download = `finance-tracker-backup-${date}.json`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);

  localStorage.setItem(BACKUP_STORAGE_KEY, new Date().toISOString());

  updateBackupPage();

  showToast("Backup exported successfully.");
}

/* =========================================================
   IMPORT BACKUP
========================================================= */

function importBackup(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = function () {
    try {
      const backup = JSON.parse(reader.result);

      if (!backup || !Array.isArray(backup.transactions)) {
        throw new Error("Invalid backup format.");
      }

      const confirmed = confirm(
        "Importing this backup will replace your current transactions and categories. Continue?",
      );

      if (!confirmed) {
        event.target.value = "";

        return;
      }

      transactions = backup.transactions.map(normalizeTransaction);

      if (Array.isArray(backup.categories) && backup.categories.length > 0) {
        categories = backup.categories;
      } else {
        categories = [...DEFAULT_CATEGORIES];
      }

      saveData();

      updateAll();

      showToast("Backup imported successfully.");
    } catch (error) {
      console.error(error);

      showToast("Invalid or corrupted backup file.");
    }

    event.target.value = "";
  };

  reader.readAsText(file);
}

/* =========================================================
   BACKUP PAGE
========================================================= */

function updateBackupPage() {
  document.getElementById("storageTransactionCount").textContent =
    transactions.length;

  document.getElementById("storageCategoryCount").textContent =
    categories.length;

  const lastBackup = localStorage.getItem(BACKUP_STORAGE_KEY);

  document.getElementById("lastBackupText").textContent = lastBackup
    ? new Date(lastBackup).toLocaleString()
    : "Never";

  document.getElementById("storageStatusText").textContent = "Active";
}

/* =========================================================
   MOBILE MENU
========================================================= */

function setupMobileMenu() {
  document.getElementById("mobileMenuBtn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");

    document.getElementById("mobileOverlay").classList.toggle("active");
  });

  document
    .getElementById("mobileOverlay")
    .addEventListener("click", closeMobileMenu);
}

function closeMobileMenu() {
  document.getElementById("sidebar").classList.remove("open");

  document.getElementById("mobileOverlay").classList.remove("active");
}

/* =========================================================
   TOAST
========================================================= */

function showToast(message) {
  const toast = document.getElementById("toast");

  const toastMessage = document.getElementById("toastMessage");

  toastMessage.textContent = message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

/* =========================================================
   GLOBAL FUNCTIONS
   Needed for inline table buttons
========================================================= */

window.openEditModal = openEditModal;

window.openDeleteModal = openDeleteModal;

window.removeCategory = removeCategory;
