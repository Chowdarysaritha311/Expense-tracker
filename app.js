/**
 * Vesper Main Application Controller
 */

import { 
  sanitize, 
  generateId, 
  formatCurrency, 
  formatDateISO, 
  formatDateFriendly, 
  getRelativeDayName, 
  getIcon 
} from './utils.js';

import { 
  loadData, 
  saveData, 
  resetData, 
  validateImportData 
} from './storage.js';

// Category Definitions
const EXPENSE_CATEGORIES = ['Food', 'Shopping', 'Housing & Rent', 'Transportation', 'Entertainment', 'Utilities', 'Healthcare', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investments', 'Other'];
const CATEGORY_COLORS = {
  'Food': '#6366f1',          // Indigo
  'Shopping': '#ec4899',      // Pink
  'Housing & Rent': '#14b8a6', // Teal
  'Transportation': '#f59e0b', // Amber
  'Entertainment': '#10b981', // Emerald
  'Utilities': '#3b82f6',     // Blue
  'Healthcare': '#8b5cf6',    // Violet
  'Salary': '#10b981',        // Emerald
  'Freelance': '#8b5cf6',     // Violet
  'Investments': '#3b82f6',   // Blue
  'Other': '#71717a'          // Gray
};

// Global App State
let state = {
  version: 1,
  settings: {
    currency: 'INR',
    currencySymbol: '₹',
    startOfWeek: 'Mon',
    budget: 50000
  },
  transactions: []
};

let currentView = 'dashboard';
let recentlyDeletedTx = null;
let undoTimeoutId = null;
let editingTxId = null;
let selectedMonth = ''; // YYYY-MM
let lastFocusedElement = null; // for modal focus restoration

// Active Ledger Filters
const activeFilters = {
  search: '',
  type: 'all',
  category: 'all',
  startDate: '',
  endDate: '',
  sort: 'date-desc'
};

// DOM Cache
const dom = {
  // Views & Navigation
  views: {
    dashboard: document.getElementById('view-dashboard'),
    transactions: document.getElementById('view-transactions'),
    settings: document.getElementById('view-settings')
  },
  tabs: {
    dashboard: document.getElementById('tab-dashboard'),
    transactions: document.getElementById('tab-transactions'),
    settings: document.getElementById('tab-settings')
  },
  
  // Triggers
  btnAddDesktop: document.getElementById('btn-add-desktop'),
  btnAddFab: document.getElementById('btn-add-fab'),
  btnAddEmptyState: document.getElementById('btn-add-empty-state'),
  
  // Dashboard Metrics
  metricIncome: document.getElementById('metric-total-income'),
  metricExpense: document.getElementById('metric-total-expense'),
  metricSavings: document.getElementById('metric-net-savings'),
  monthSelect: document.getElementById('dashboard-month-select'),
  
  // Budget
  budgetProgressText: document.getElementById('budget-progress-text'),
  budgetPercentageBadge: document.getElementById('budget-percentage-badge'),
  budgetProgressBar: document.getElementById('budget-progress-bar'),
  budgetFooterText: document.getElementById('budget-footer-text'),
  
  // Charts
  donutSvg: document.getElementById('donut-svg'),
  donutLegend: document.getElementById('donut-legend'),
  donutTotalAmount: document.getElementById('donut-total-amount'),
  trendSvg: document.getElementById('trend-svg'),
  trendXAxis: document.getElementById('trend-x-axis'),
  trendChartEmpty: document.getElementById('trend-chart-empty'),
  
  // Ledger Filters
  filterSearch: document.getElementById('filter-search'),
  filterType: document.getElementById('filter-type'),
  filterCategory: document.getElementById('filter-category'),
  filterStartDate: document.getElementById('filter-start-date'),
  filterEndDate: document.getElementById('filter-end-date'),
  filterSort: document.getElementById('filter-sort'),
  btnClearFilters: document.getElementById('btn-clear-filters'),
  ledgerList: document.getElementById('ledger-list'),
  
  // Transaction Editor Drawer
  drawerOverlay: document.getElementById('drawer-overlay'),
  drawerContainer: document.getElementById('drawer-container'),
  btnDrawerClose: document.getElementById('btn-drawer-close'),
  btnDrawerCancel: document.getElementById('btn-drawer-cancel'),
  btnDrawerDelete: document.getElementById('btn-drawer-delete'),
  btnDrawerSubmit: document.getElementById('btn-drawer-submit'),
  drawerTitle: document.getElementById('drawer-title-text'),
  transactionForm: document.getElementById('transaction-form'),
  formTxId: document.getElementById('form-tx-id'),
  formCurrencySymbol: document.getElementById('form-currency-symbol'),
  
  // Settings view inputs
  settingBudget: document.getElementById('setting-budget'),
  settingCurrencySymbol: document.getElementById('setting-currency-symbol'),
  settingCurrencyCode: document.getElementById('setting-currency-code'),
  settingStartOfWeek: document.getElementById('setting-start-of-week'),
  btnSaveSettings: document.getElementById('btn-save-settings'),
  
  // Data Tools
  btnExportCsv: document.getElementById('btn-export-csv'),
  importFileInput: document.getElementById('import-file-input'),
  btnResetModal: document.getElementById('btn-reset-modal'),
  
  // Modals
  confirmOverlay: document.getElementById('confirm-modal-overlay'),
  confirmDialog: document.getElementById('confirm-dialog'),
  btnConfirmCancel: document.getElementById('btn-confirm-cancel'),
  btnConfirmReset: document.getElementById('btn-confirm-reset'),
  
  // Corrupt Data
  corruptOverlay: document.getElementById('corrupt-modal-overlay'),
  corruptDialog: document.getElementById('corrupt-dialog'),
  btnCorruptExport: document.getElementById('btn-corrupt-export'),
  btnCorruptReset: document.getElementById('btn-corrupt-reset'),
  
  // Toasts
  snackbarContainer: document.getElementById('snackbar-container')
};

// Initial Setup
window.addEventListener('DOMContentLoaded', () => {
  renderIcons();
  initApp();
});

function initApp() {
  const result = loadData();
  
  if (result.corrupted) {
    showCorruptModal(result.errorMsg);
    return;
  }
  
  state = result.data;
  
  // Set default selected month as current year-month
  const today = new Date();
  selectedMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  // Initial presets
  setupMonthSelectors();
  populateCategorySelects();
  setupSettingsFields();
  
  // Event listeners
  registerEventListeners();
  
  // Render
  renderDashboard();
  renderLedger();
  
  // Access check
  checkAccessibilityPass();
}

// Icon rendering helper
function renderIcons() {
  document.querySelectorAll('[data-icon]').forEach(el => {
    const name = el.getAttribute('data-icon');
    const customClass = el.className || '';
    el.innerHTML = getIcon(name, customClass);
  });
  
  // Specific logo icon loading
  const logoBox = document.getElementById('logo-icon-placeholder');
  if (logoBox) {
    logoBox.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>`;
  }
}

// Event bindings
function registerEventListeners() {
  // Tabs Navigation
  Object.keys(dom.tabs).forEach(key => {
    dom.tabs[key].addEventListener('click', () => {
      switchView(key);
    });
  });
  
  // Drawer triggers
  const openAddDrawer = () => {
    openDrawer(null);
  };
  dom.btnAddDesktop.addEventListener('click', openAddDrawer);
  dom.btnAddFab.addEventListener('click', openAddDrawer);
  if (dom.btnAddEmptyState) {
    // We delegate empty state trigger because list re-renders
    dom.ledgerList.addEventListener('click', (e) => {
      const emptyBtn = e.target.closest('#btn-add-empty-state');
      if (emptyBtn) openAddDrawer();
    });
  }
  
  dom.btnDrawerClose.addEventListener('click', closeDrawer);
  dom.btnDrawerCancel.addEventListener('click', closeDrawer);
  
  // Drawer form submit
  dom.transactionForm.addEventListener('submit', handleFormSubmit);
  
  // Drawer transaction type change (Income vs Expense)
  const typeRadios = dom.transactionForm.querySelectorAll('input[name="tx-type"]');
  typeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      populateFormCategories(e.target.value);
    });
  });
  
  // Drawer Delete button
  dom.btnDrawerDelete.addEventListener('click', () => {
    if (editingTxId) {
      deleteTransaction(editingTxId);
    }
  });
  
  // Month selection changes
  dom.monthSelect.addEventListener('change', (e) => {
    selectedMonth = e.target.value;
    renderDashboard();
  });
  
  // Ledger filter changes
  dom.filterSearch.addEventListener('input', (e) => {
    activeFilters.search = e.target.value;
    renderLedger();
  });
  dom.filterType.addEventListener('change', (e) => {
    activeFilters.type = e.target.value;
    renderLedger();
  });
  dom.filterCategory.addEventListener('change', (e) => {
    activeFilters.category = e.target.value;
    renderLedger();
  });
  dom.filterStartDate.addEventListener('change', (e) => {
    activeFilters.startDate = e.target.value;
    renderLedger();
  });
  dom.filterEndDate.addEventListener('change', (e) => {
    activeFilters.endDate = e.target.value;
    renderLedger();
  });
  dom.filterSort.addEventListener('change', (e) => {
    activeFilters.sort = e.target.value;
    renderLedger();
  });
  dom.btnClearFilters.addEventListener('click', clearFilters);
  
  // Settings update
  dom.btnSaveSettings.addEventListener('click', saveSettings);
  
  // Export/Import/Reset data actions
  dom.btnExportCsv.addEventListener('click', exportToCsv);
  dom.importFileInput.addEventListener('change', handleJsonImport);
  
  // Reset confirmation
  dom.btnResetModal.addEventListener('click', () => {
    openConfirmModal();
  });
  dom.btnConfirmCancel.addEventListener('click', closeConfirmModal);
  dom.btnConfirmReset.addEventListener('click', triggerReset);
  
  // Corrupt state actions
  dom.btnCorruptExport.addEventListener('click', exportCorruptDataText);
  dom.btnCorruptReset.addEventListener('click', () => {
    resetData();
    location.reload();
  });
  
  // Escape key closes modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (dom.drawerOverlay.classList.contains('active')) {
        closeDrawer();
      }
      if (dom.confirmOverlay.classList.contains('active')) {
        closeConfirmModal();
      }
    }
  });
  
  // Redraw charts on resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (currentView === 'dashboard') {
        renderDashboardCharts();
      }
    }, 150);
  });
}

// Router
function switchView(viewName) {
  if (viewName === currentView) return;
  
  currentView = viewName;
  
  // Update nav UI
  Object.keys(dom.tabs).forEach(key => {
    if (key === viewName) {
      dom.tabs[key].classList.add('active');
      dom.tabs[key].setAttribute('aria-selected', 'true');
    } else {
      dom.tabs[key].classList.remove('active');
      dom.tabs[key].setAttribute('aria-selected', 'false');
    }
  });
  
  // Update views panels visibility
  Object.keys(dom.views).forEach(key => {
    if (key === viewName) {
      dom.views[key].classList.add('active');
    } else {
      dom.views[key].classList.remove('active');
    }
  });
  
  // Extra rendering updates
  if (viewName === 'dashboard') {
    setupMonthSelectors();
    renderDashboard();
  } else if (viewName === 'transactions') {
    renderLedger();
  } else if (viewName === 'settings') {
    setupSettingsFields();
  }
}

// Category lists populate
function populateCategorySelects() {
  // Populates the filter dropdown
  const filterCat = dom.filterCategory;
  filterCat.innerHTML = '<option value="all">All Categories</option>';
  
  // Merge both categories
  const allCats = Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]));
  allCats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    filterCat.appendChild(opt);
  });
}

function populateFormCategories(type) {
  const select = document.getElementById('form-category');
  const oldVal = select.value;
  select.innerHTML = '<option value="" disabled selected>Select category...</option>';
  
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  list.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
  
  // Keep choice if valid
  if (list.includes(oldVal)) {
    select.value = oldVal;
  }
}

// Settings inputs setup
function setupSettingsFields() {
  dom.settingBudget.value = state.settings.budget;
  dom.settingCurrencySymbol.value = state.settings.currencySymbol;
  dom.settingCurrencyCode.value = state.settings.currency || 'INR';
  dom.settingStartOfWeek.value = state.settings.startOfWeek || 'Mon';
  
  // Set current form symbol placeholder
  dom.formCurrencySymbol.textContent = state.settings.currencySymbol;
}

// Setup Dashboard Months dropdown
function setupMonthSelectors() {
  const select = dom.monthSelect;
  const oldVal = select.value || selectedMonth;
  select.innerHTML = '';
  
  // Calculate months from transactions
  const months = new Set();
  
  // Always include current month
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  months.add(currentMonthStr);
  
  state.transactions.forEach(tx => {
    if (tx.date && tx.date.length >= 7) {
      months.add(tx.date.substring(0, 7));
    }
  });
  
  const sorted = Array.from(months).sort().reverse();
  sorted.forEach(m => {
    const parts = m.split('-');
    const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
    const label = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = label;
    select.appendChild(opt);
  });
  
  // Re-verify if choice remains valid, else fallback to current month
  if (sorted.includes(oldVal)) {
    select.value = oldVal;
    selectedMonth = oldVal;
  } else {
    select.value = currentMonthStr;
    selectedMonth = currentMonthStr;
  }
}

// Dashboard Calculations & Render
function renderDashboard() {
  // Filter transactions for selectedMonth (YYYY-MM)
  const monthlyTxs = state.transactions.filter(tx => tx.date.startsWith(selectedMonth));
  
  let income = 0;
  let expense = 0;
  
  monthlyTxs.forEach(tx => {
    if (tx.type === 'income') {
      income += tx.amount;
    } else {
      expense += tx.amount;
    }
  });
  
  const net = income - expense;
  
  // Set values
  dom.metricIncome.textContent = formatCurrency(income, state.settings);
  dom.metricExpense.textContent = formatCurrency(expense, state.settings);
  dom.metricSavings.textContent = formatCurrency(net, state.settings);
  
  // Net styles (negative savings indicators)
  if (net < 0) {
    dom.metricSavings.className = 'metric-value expense';
  } else if (net > 0) {
    dom.metricSavings.className = 'metric-value income';
  } else {
    dom.metricSavings.className = 'metric-value';
  }
  
  // Render Budget Progress
  const budget = state.settings.budget;
  dom.budgetProgressText.textContent = `Spent ${formatCurrency(expense, state.settings)} of ${formatCurrency(budget, state.settings)}`;
  
  let pct = 0;
  if (budget > 0) {
    pct = Math.round((expense / budget) * 100);
  }
  
  dom.budgetPercentageBadge.textContent = `${pct}%`;
  dom.budgetProgressBar.style.width = `${Math.min(pct, 100)}%`;
  
  // Warning states
  dom.budgetProgressBar.className = 'v-progress-bar';
  dom.budgetFooterText.className = 'budget-footer';
  
  if (pct >= 100) {
    dom.budgetProgressBar.classList.add('danger');
    dom.budgetFooterText.classList.add('danger');
    dom.budgetFooterText.innerHTML = `${getIcon('alert', 'v-icon')} Budget limit crossed! Exceeded by ${formatCurrency(expense - budget, state.settings)}`;
  } else if (pct >= 80) {
    dom.budgetProgressBar.classList.add('warning');
    dom.budgetFooterText.classList.add('warning');
    dom.budgetFooterText.innerHTML = `${getIcon('info', 'v-icon')} Warning: Budget is at ${pct}% of capacity.`;
  } else {
    dom.budgetFooterText.innerHTML = `${getIcon('check', 'v-icon')} All good! You are well within your monthly limit.`;
  }
  
  // Re-draw native charts
  renderDashboardCharts(monthlyTxs, expense);
}

// Render dynamic SVGs for Donut & Trend charts
function renderDashboardCharts(monthlyTxs = null, totalExpense = null) {
  if (!monthlyTxs) {
    monthlyTxs = state.transactions.filter(tx => tx.date.startsWith(selectedMonth));
  }
  if (totalExpense === null) {
    totalExpense = monthlyTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
  }
  
  const expensesOnly = monthlyTxs.filter(tx => tx.type === 'expense');
  
  // --- Donut Chart ---
  dom.donutTotalAmount.textContent = formatCurrency(totalExpense, state.settings);
  
  if (totalExpense === 0) {
    // Draw solid empty circle
    dom.donutSvg.innerHTML = `<circle cx="50" cy="50" r="40" fill="transparent" stroke="#222227" stroke-width="8"></circle>`;
    dom.donutLegend.innerHTML = `<p class="empty-text">No expense transactions recorded this month.</p>`;
  } else {
    // Calculate category spending
    const catMap = {};
    expensesOnly.forEach(tx => {
      catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
    });
    
    // Sort descending
    const sortedCats = Object.keys(catMap).map(cat => ({
      name: cat,
      amount: catMap[cat],
      pct: (catMap[cat] / totalExpense) * 100
    })).sort((a, b) => b.amount - a.amount);
    
    // SVG values: Radius 40. Circumference C = 2 * PI * r = 251.327
    const r = 40;
    const C = 2 * Math.PI * r;
    
    let currentOffset = 0;
    let svgHtml = '';
    let legendHtml = '';
    
    sortedCats.forEach((cat, idx) => {
      const color = CATEGORY_COLORS[cat.name] || '#71717a';
      const strokeDash = (cat.amount / totalExpense) * C;
      const strokeOffset = C - strokeDash + currentOffset;
      
      svgHtml += `<circle class="donut-segment" 
                         cx="50" 
                         cy="50" 
                         r="${r}" 
                         fill="transparent" 
                         stroke="${color}" 
                         stroke-width="8" 
                         stroke-dasharray="${strokeDash} ${C - strokeDash}" 
                         stroke-dashoffset="${strokeOffset}" 
                         aria-label="${cat.name}: ${cat.pct.toFixed(1)}%">
                  </circle>`;
      
      currentOffset -= strokeDash;
      
      // Build legend row
      legendHtml += `
        <div class="legend-row">
          <div class="legend-label-group">
            <span class="legend-color-indicator" style="background-color: ${color}"></span>
            <span class="legend-category">${sanitize(cat.name)}</span>
          </div>
          <div class="legend-details">
            <span class="legend-pct">${cat.pct.toFixed(0)}%</span>
            <span class="legend-val">${formatCurrency(cat.amount, state.settings)}</span>
          </div>
        </div>
      `;
    });
    
    dom.donutSvg.innerHTML = svgHtml;
    dom.donutLegend.innerHTML = legendHtml;
  }
  
  // --- Trend Line Chart (Cumulative Expense) ---
  const trendOverlay = dom.trendChartEmpty;
  
  if (expensesOnly.length === 0) {
    trendOverlay.classList.add('visible');
    dom.trendSvg.innerHTML = '';
  } else {
    trendOverlay.classList.remove('visible');
    
    // Determine days in selectedMonth
    const parts = selectedMonth.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // 1-indexed
    
    const numDays = new Date(year, month, 0).getDate();
    
    // Establish days spend array
    const dailyExpenses = new Array(numDays).fill(0);
    expensesOnly.forEach(tx => {
      const day = parseInt(tx.date.substring(8, 10), 10);
      if (day >= 1 && day <= numDays) {
        dailyExpenses[day - 1] += tx.amount;
      }
    });
    
    // Create cumulative sum array
    const cumulativeSpend = [];
    let accum = 0;
    for (let i = 0; i < numDays; i++) {
      accum += dailyExpenses[i];
      cumulativeSpend.push(accum);
    }
    
    // Draw SVG coordinates
    // Width = 500, Height = 200 (viewBox has height padding)
    const chartW = 500;
    const chartH = 180;
    const paddingT = 20;
    const usableH = chartH - paddingT;
    
    const maxVal = Math.max(...cumulativeSpend, state.settings.budget, 100);
    
    const points = [];
    for (let i = 0; i < numDays; i++) {
      const x = (i / (numDays - 1)) * chartW;
      const y = chartH - ((cumulativeSpend[i] / maxVal) * usableH);
      points.push({ x, y });
    }
    
    // Construct line path
    let linePathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      linePathD += ` L ${points[i].x} ${points[i].y}`;
    }
    
    // Construct area path
    const areaPathD = `${linePathD} L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`;
    
    // Render
    let trendSvgHtml = `
      <defs>
        <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#6366f1" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
    `;
    
    // Draw helper budget limit line (dashed)
    const budgetY = chartH - ((state.settings.budget / maxVal) * usableH);
    if (budgetY >= paddingT && budgetY <= chartH) {
      trendSvgHtml += `
        <line x1="0" y1="${budgetY}" x2="${chartW}" y2="${budgetY}" 
              stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4 4" 
              aria-hidden="true">
        </line>
        <text x="8" y="${budgetY - 6}" fill="#ef4444" font-size="9" font-family="var(--font-numeric)" font-weight="600">
          BUDGET (${state.settings.currencySymbol}${state.settings.budget})
        </text>
      `;
    }
    
    // Add area fill and line
    trendSvgHtml += `
      <path class="trend-area" d="${areaPathD}"></path>
      <path class="trend-line" d="${linePathD}"></path>
    `;
    
    // Draw dots for transaction days (visual cues)
    points.forEach((pt, i) => {
      if (dailyExpenses[i] > 0) {
        trendSvgHtml += `
          <circle cx="${pt.x}" cy="${pt.y}" r="4" fill="#ffffff" stroke="#6366f1" stroke-width="2"
                  tabindex="0" aria-label="Day ${i + 1}: Cumulative ${formatCurrency(cumulativeSpend[i], state.settings)}">
          </circle>
        `;
      }
    });
    
    dom.trendSvg.innerHTML = trendSvgHtml;
    
    // Update X axis labels
    dom.trendXAxis.innerHTML = `
      <span>1st</span>
      <span>15th</span>
      <span>${numDays === 31 ? '31st' : numDays === 30 ? '30th' : numDays === 29 ? '29th' : '28th'}</span>
    `;
  }
}

// Ledger filtering / Sorting & Render
function renderLedger() {
  let filtered = [...state.transactions];
  
  // Search filter (note text)
  if (activeFilters.search) {
    const q = activeFilters.search.toLowerCase();
    filtered = filtered.filter(tx => tx.note && tx.note.toLowerCase().includes(q));
  }
  
  // Type filter
  if (activeFilters.type !== 'all') {
    filtered = filtered.filter(tx => tx.type === activeFilters.type);
  }
  
  // Category filter
  if (activeFilters.category !== 'all') {
    filtered = filtered.filter(tx => tx.category === activeFilters.category);
  }
  
  // Date range filters
  if (activeFilters.startDate) {
    filtered = filtered.filter(tx => tx.date >= activeFilters.startDate);
  }
  if (activeFilters.endDate) {
    filtered = filtered.filter(tx => tx.date <= activeFilters.endDate);
  }
  
  // Sorting
  filtered.sort((a, b) => {
    if (activeFilters.sort === 'date-desc') {
      const cmp = b.date.localeCompare(a.date);
      return cmp !== 0 ? cmp : b.createdAt.localeCompare(a.createdAt);
    } else if (activeFilters.sort === 'date-asc') {
      const cmp = a.date.localeCompare(b.date);
      return cmp !== 0 ? cmp : a.createdAt.localeCompare(b.createdAt);
    } else if (activeFilters.sort === 'amount-desc') {
      return b.amount - a.amount;
    } else if (activeFilters.sort === 'amount-asc') {
      return a.amount - b.amount;
    }
    return 0;
  });
  
  // Clear lists
  dom.ledgerList.innerHTML = '';
  
  if (filtered.length === 0) {
    renderLedgerEmptyState();
    return;
  }
  
  // Group by day (only if sorted by date, but grouping is requested for transactions list)
  // Standard grouped output:
  const dayGroups = {};
  filtered.forEach(tx => {
    dayGroups[tx.date] = dayGroups[tx.date] || [];
    dayGroups[tx.date].push(tx);
  });
  
  // Determine date headers sorting order based on active filter
  const isAsc = activeFilters.sort === 'date-asc';
  const sortedDays = Object.keys(dayGroups).sort((a, b) => {
    return isAsc ? a.localeCompare(b) : b.localeCompare(a);
  });
  
  sortedDays.forEach(dateStr => {
    const dayTransactions = dayGroups[dateStr];
    
    // Subtotal calculation (Net = Income - Expenses)
    let netSubtotal = 0;
    dayTransactions.forEach(t => {
      if (t.type === 'income') netSubtotal += t.amount;
      else netSubtotal -= t.amount;
    });
    
    const subtotalText = netSubtotal >= 0 
      ? `+${formatCurrency(netSubtotal, state.settings)}` 
      : `-${formatCurrency(Math.abs(netSubtotal), state.settings)}`;
    
    const subtotalClass = netSubtotal >= 0 ? 'ledger-day-subtotal income' : 'ledger-day-subtotal';
    
    // Group container
    const groupDiv = document.createElement('div');
    groupDiv.className = 'ledger-day-group';
    
    groupDiv.innerHTML = `
      <div class="ledger-day-header">
        <span class="ledger-day-date">${getRelativeDayName(dateStr)}</span>
        <span class="${subtotalClass}">${subtotalText}</span>
      </div>
      <div class="ledger-day-items"></div>
    `;
    
    const itemsContainer = groupDiv.querySelector('.ledger-day-items');
    
    dayTransactions.forEach(tx => {
      const row = document.createElement('div');
      row.className = 'ledger-row';
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      row.setAttribute('aria-label', `Edit ${tx.category} transaction for ${formatCurrency(tx.amount, state.settings)}`);
      
      const iconColor = CATEGORY_COLORS[tx.category] || '#71717a';
      const typeSign = tx.type === 'income' ? '+' : '-';
      const amountClass = tx.type === 'income' ? 'row-amount income' : 'row-amount expense';
      
      // Payment badge markup
      const paymentBadge = tx.paymentMethod 
        ? `<span class="payment-badge">${sanitize(tx.paymentMethod)}</span>` 
        : '';
        
      row.innerHTML = `
        <div class="row-icon-cell">
          <div class="row-category-icon" style="border-color: ${iconColor}; color: ${iconColor}; background-color: ${iconColor}15">
            ${getIcon(getCategoryIconName(tx.category))}
          </div>
        </div>
        <div class="row-details-cell">
          <span class="row-category-name">${sanitize(tx.category)}</span>
          <span class="row-note">${sanitize(tx.note) || 'No description'}</span>
          <div class="row-meta-row">${paymentBadge}</div>
        </div>
        <div class="row-value-cell">
          <span class="${amountClass}">${typeSign} ${formatCurrency(tx.amount, state.settings).replace(state.settings.currencySymbol, '').trim()}</span>
          <div class="row-actions-group">
            <button class="btn-row-action btn-edit" aria-label="Edit transaction">
              ${getIcon('edit')}
            </button>
            <button class="btn-row-action btn-delete" aria-label="Delete transaction">
              ${getIcon('trash')}
            </button>
          </div>
        </div>
      `;
      
      // Click handlers
      const openEdit = (e) => {
        // Prevent opening edit if delete button clicked
        if (e.target.closest('.btn-delete')) return;
        
        lastFocusedElement = row;
        openDrawer(tx.id);
      };
      
      row.addEventListener('click', openEdit);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openEdit(e);
        }
      });
      
      // Specific Row Delete handler
      row.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTransaction(tx.id);
      });
      
      itemsContainer.appendChild(row);
    });
    
    dom.ledgerList.appendChild(groupDiv);
  });
}

function renderLedgerEmptyState() {
  dom.ledgerList.innerHTML = `
    <div class="empty-state">
      <p class="empty-title">No transactions match filters</p>
      <p class="empty-desc">Try clearing filters or search query to find your records.</p>
      <button class="v-btn v-btn-primary" id="btn-add-empty-state">
        ${getIcon('plus', 'btn-icon')}
        <span>Log Transaction</span>
      </button>
    </div>
  `;
}

// Maps category name to icon name
function getCategoryIconName(cat) {
  const map = {
    'Food': 'arrow-down',
    'Shopping': 'arrow-down',
    'Housing & Rent': 'wallet',
    'Transportation': 'arrow-down',
    'Entertainment': 'chart',
    'Utilities': 'settings',
    'Healthcare': 'info',
    'Salary': 'arrow-up',
    'Freelance': 'arrow-up',
    'Investments': 'arrow-up',
    'Other': 'info'
  };
  return map[cat] || 'info';
}

// Clear active ledger filters
function clearFilters() {
  activeFilters.search = '';
  activeFilters.type = 'all';
  activeFilters.category = 'all';
  activeFilters.startDate = '';
  activeFilters.endDate = '';
  activeFilters.sort = 'date-desc';
  
  dom.filterSearch.value = '';
  dom.filterType.value = 'all';
  dom.filterCategory.value = 'all';
  dom.filterStartDate.value = '';
  dom.filterEndDate.value = '';
  dom.filterSort.value = 'date-desc';
  
  renderLedger();
}

// Transaction Modal/Drawer Open/Close
function openDrawer(txId = null) {
  editingTxId = txId;
  
  // Set defaults
  resetValidationErrors();
  
  const typeRadios = dom.transactionForm.querySelectorAll('input[name="tx-type"]');
  const amountInput = document.getElementById('form-amount');
  const catSelect = document.getElementById('form-category');
  const dateInput = document.getElementById('form-date');
  const noteText = document.getElementById('form-note');
  const paymentSelect = document.getElementById('form-payment');
  
  if (txId) {
    // EDIT MODE
    const tx = state.transactions.find(t => t.id === txId);
    if (!tx) return;
    
    dom.drawerTitle.textContent = 'Edit Transaction';
    dom.formTxId.value = tx.id;
    
    // Set type
    typeRadios.forEach(radio => {
      radio.checked = radio.value === tx.type;
    });
    
    // Populate categories based on type
    populateFormCategories(tx.type);
    
    amountInput.value = tx.amount;
    catSelect.value = tx.category;
    dateInput.value = tx.date;
    noteText.value = tx.note || '';
    paymentSelect.value = tx.paymentMethod || '';
    
    dom.btnDrawerDelete.classList.remove('hide');
  } else {
    // ADD MODE
    dom.drawerTitle.textContent = 'Add Transaction';
    dom.formTxId.value = '';
    
    // Reset to defaults
    typeRadios.forEach(radio => {
      radio.checked = radio.value === 'expense';
    });
    
    populateFormCategories('expense');
    
    amountInput.value = '';
    catSelect.value = '';
    dateInput.value = formatDateISO(new Date());
    noteText.value = '';
    paymentSelect.value = '';
    
    dom.btnDrawerDelete.classList.add('hide');
  }
  
  // Open transitions
  dom.drawerOverlay.classList.add('active');
  dom.drawerOverlay.setAttribute('aria-hidden', 'false');
  
  // Trap Focus & set active
  setTimeout(() => {
    dom.drawerContainer.focus();
    setupFocusTrap(dom.drawerOverlay, dom.drawerContainer);
  }, 100);
}

function closeDrawer() {
  dom.drawerOverlay.classList.remove('active');
  dom.drawerOverlay.setAttribute('aria-hidden', 'true');
  
  // Clean Focus
  if (lastFocusedElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
}

// Validation reset
function resetValidationErrors() {
  const groups = dom.transactionForm.querySelectorAll('.form-group');
  groups.forEach(g => g.classList.remove('has-error'));
}

// Submit transaction
function handleFormSubmit(e) {
  e.preventDefault();
  resetValidationErrors();
  
  const typeVal = dom.transactionForm.querySelector('input[name="tx-type"]:checked').value;
  const amountVal = parseFloat(document.getElementById('form-amount').value);
  const categoryVal = document.getElementById('form-category').value;
  const dateVal = document.getElementById('form-date').value;
  const noteVal = document.getElementById('form-note').value.trim();
  const paymentVal = document.getElementById('form-payment').value;
  
  // Custom Validation Checks
  let isValid = true;
  
  if (isNaN(amountVal) || amountVal <= 0) {
    document.getElementById('form-amount').closest('.form-group').classList.add('has-error');
    isValid = false;
  }
  if (!categoryVal) {
    document.getElementById('form-category').closest('.form-group').classList.add('has-error');
    isValid = false;
  }
  if (!dateVal || isNaN(new Date(dateVal).getTime())) {
    document.getElementById('form-date').closest('.form-group').classList.add('has-error');
    isValid = false;
  }
  if (noteVal.length > 100) {
    document.getElementById('form-note').closest('.form-group').classList.add('has-error');
    isValid = false;
  }
  
  if (!isValid) return;
  
  const nowISO = new Date().toISOString();
  
  if (editingTxId) {
    // Update
    const idx = state.transactions.findIndex(t => t.id === editingTxId);
    if (idx !== -1) {
      state.transactions[idx] = {
        ...state.transactions[idx],
        type: typeVal,
        amount: amountVal,
        category: categoryVal,
        date: dateVal,
        note: noteVal,
        paymentMethod: paymentVal,
        updatedAt: nowISO
      };
      showSnackbar('Transaction details updated.');
    }
  } else {
    // Add New
    const newTx = {
      id: generateId(),
      type: typeVal,
      amount: amountVal,
      category: categoryVal,
      date: dateVal,
      note: noteVal,
      paymentMethod: paymentVal,
      createdAt: nowISO,
      updatedAt: nowISO
    };
    state.transactions.push(newTx);
    showSnackbar('Transaction logged successfully.');
  }
  
  saveData(state);
  closeDrawer();
  
  // Update dashboard and list views
  setupMonthSelectors();
  renderDashboard();
  renderLedger();
}

// Delete transaction
function deleteTransaction(txId) {
  const idx = state.transactions.findIndex(t => t.id === txId);
  if (idx === -1) return;
  
  // Trigger cleanup of any existing timeout
  if (undoTimeoutId) {
    clearTimeout(undoTimeoutId);
    recentlyDeletedTx = null;
  }
  
  // Hold record
  recentlyDeletedTx = state.transactions[idx];
  
  // Remove
  state.transactions.splice(idx, 1);
  saveData(state);
  
  closeDrawer();
  setupMonthSelectors();
  renderDashboard();
  renderLedger();
  
  // Show toast with undo
  showSnackbar('Transaction deleted.', 'Undo', () => {
    if (recentlyDeletedTx) {
      state.transactions.push(recentlyDeletedTx);
      // Sort again by date/createdAt if needed, but it will be updated on re-render
      saveData(state);
      recentlyDeletedTx = null;
      setupMonthSelectors();
      renderDashboard();
      renderLedger();
      showSnackbar('Transaction restored.');
    }
  });
  
  // Finalize delete after 5 seconds
  undoTimeoutId = setTimeout(() => {
    recentlyDeletedTx = null;
    undoTimeoutId = null;
  }, 5000);
}

// Settings Saving
function saveSettings() {
  const budgetVal = parseFloat(dom.settingBudget.value);
  const symbolVal = dom.settingCurrencySymbol.value.trim() || '₹';
  const codeVal = dom.settingCurrencyCode.value;
  const startVal = dom.settingStartOfWeek.value;
  
  if (isNaN(budgetVal) || budgetVal < 0) {
    alert('Please enter a valid budget amount.');
    return;
  }
  
  state.settings.budget = budgetVal;
  state.settings.currencySymbol = symbolVal;
  state.settings.currency = codeVal;
  state.settings.startOfWeek = startVal;
  
  saveData(state);
  
  // Re-sync
  dom.formCurrencySymbol.textContent = symbolVal;
  renderDashboard();
  renderLedger();
  
  showSnackbar('Preferences saved.');
}

// Export database as CSV
function exportToCsv() {
  if (state.transactions.length === 0) {
    showSnackbar('No records available to export.');
    return;
  }
  
  const headers = ['ID', 'Type', 'Amount', 'Category', 'Date', 'Note', 'Payment Method', 'Created At'];
  
  const rows = state.transactions.map(tx => {
    return [
      tx.id,
      tx.type,
      tx.amount,
      `"${tx.category.replace(/"/g, '""')}"`,
      tx.date,
      `"${(tx.note || '').replace(/"/g, '""')}"`,
      `"${(tx.paymentMethod || '').replace(/"/g, '""')}"`,
      tx.createdAt
    ];
  });
  
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `vesper-ledger-export-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showSnackbar('CSV export completed.');
}

// Import JSON database
function handleJsonImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const parsed = JSON.parse(evt.target.result);
      const validation = validateImportData(parsed);
      
      if (!validation.valid) {
        let errSummary = 'Malformed database file:\n';
        validation.errors.slice(0, 5).forEach(err => {
          errSummary += `- ${err}\n`;
        });
        if (validation.errors.length > 5) {
          errSummary += `... and ${validation.errors.length - 5} more errors.`;
        }
        alert(errSummary);
        return;
      }
      
      // Confirm Import
      if (confirm('Importing this file will merge its transactions with your current data. Do you wish to proceed?')) {
        // Merge settings or overwrite if imported version has newer settings
        state.settings = parsed.settings || state.settings;
        
        // Merge transactions (prevent duplicate IDs)
        const currentIds = new Set(state.transactions.map(t => t.id));
        parsed.transactions.forEach(tx => {
          if (!currentIds.has(tx.id)) {
            state.transactions.push(tx);
          }
        });
        
        // Save
        saveData(state);
        
        // Refresh UI
        setupMonthSelectors();
        setupSettingsFields();
        renderDashboard();
        renderLedger();
        
        showSnackbar('JSON data restored successfully.');
      }
    } catch (err) {
      alert(`Invalid JSON format: ${err.message}`);
    } finally {
      // Reset input
      dom.importFileInput.value = '';
    }
  };
  
  reader.readAsText(file);
}

// Confirm dialog operations
function openConfirmModal() {
  lastFocusedElement = document.activeElement;
  dom.confirmOverlay.classList.add('active');
  dom.confirmOverlay.classList.add('center-overlay');
  dom.confirmOverlay.setAttribute('aria-hidden', 'false');
  
  setTimeout(() => {
    dom.confirmDialog.focus();
    setupFocusTrap(dom.confirmOverlay, dom.confirmDialog);
  }, 100);
}

function closeConfirmModal() {
  dom.confirmOverlay.classList.remove('active');
  dom.confirmOverlay.classList.remove('center-overlay');
  dom.confirmOverlay.setAttribute('aria-hidden', 'true');
  
  if (lastFocusedElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
}

function triggerReset() {
  state = resetData();
  closeConfirmModal();
  
  // Re-sync
  setupMonthSelectors();
  setupSettingsFields();
  renderDashboard();
  renderLedger();
  
  showSnackbar('Ledger has been cleared.');
}

// Corrupted data handling
function showCorruptModal(errDetails) {
  console.warn('Database error:', errDetails);
  dom.corruptOverlay.classList.add('active');
  dom.corruptOverlay.classList.add('center-overlay');
  dom.corruptOverlay.setAttribute('aria-hidden', 'false');
  
  setTimeout(() => {
    dom.corruptDialog.focus();
    setupFocusTrap(dom.corruptOverlay, dom.corruptDialog);
  }, 100);
}

function exportCorruptDataText() {
  const raw = localStorage.getItem('expenseTracker:data') || 'No data found';
  const blob = new Blob([raw], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'corrupted-vesper-dump.txt');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Snackbar notification renderer
function showSnackbar(message, actionLabel = null, actionCallback = null) {
  // Create Element
  const snackbar = document.createElement('div');
  snackbar.className = 'v-snackbar';
  snackbar.innerHTML = `<span class="v-snackbar-text">${sanitize(message)}</span>`;
  
  if (actionLabel && actionCallback) {
    const btn = document.createElement('button');
    btn.className = 'v-snackbar-btn';
    btn.textContent = actionLabel;
    btn.addEventListener('click', () => {
      actionCallback();
      snackbar.classList.add('fade-out');
      setTimeout(() => snackbar.remove(), 250);
    });
    snackbar.appendChild(btn);
  }
  
  dom.snackbarContainer.appendChild(snackbar);
  
  // Self destruct after 5 seconds (only if not clicked)
  setTimeout(() => {
    if (snackbar.parentNode) {
      snackbar.classList.add('fade-out');
      setTimeout(() => snackbar.remove(), 250);
    }
  }, 4800);
}

// Focus Trapping Helper for Modals & Drawers
function setupFocusTrap(overlay, container) {
  const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const focusables = container.querySelectorAll(focusableSelectors);
  
  if (focusables.length === 0) return;
  
  const firstFocusable = focusables[0];
  const lastFocusable = focusables[focusables.length - 1];
  
  const trapHandler = (e) => {
    if (e.key === 'Tab') {
      const isShift = e.shiftKey;
      
      // If modal overlay is no longer active, remove listener
      if (!overlay.classList.contains('active')) {
        container.removeEventListener('keydown', trapHandler);
        return;
      }
      
      if (isShift) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
  };
  
  // Bind keydown inside container
  container.addEventListener('keydown', trapHandler);
}

// Simple Accessibility checks
function checkAccessibilityPass() {
  // Ensure landmark ARIA tags are correctly mapped
  const viewsList = Object.keys(dom.views).map(k => dom.views[k]);
  viewsList.forEach(view => {
    view.setAttribute('role', 'region');
    view.setAttribute('aria-labelledby', `tab-${view.id.replace('view-', '')}`);
  });
}
