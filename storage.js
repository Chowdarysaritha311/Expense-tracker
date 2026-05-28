/**
 * Vesper Storage Layer
 */

const STORAGE_KEY = 'expenseTracker:data';
const CURRENT_VERSION = 1;

export const DEFAULT_DATA = {
  version: CURRENT_VERSION,
  settings: {
    currency: 'INR',
    currencySymbol: '₹',
    startOfWeek: 'Mon',
    budget: 50000
  },
  transactions: []
};

/**
 * Loads and migrates data from localStorage.
 * Defensive against syntax/parsing errors and returns a structure indicating issues if found.
 * @returns {Object} { data: Object, corrupted: boolean, errorMsg: string }
 */
export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialize with default data
      saveData(DEFAULT_DATA);
      return { data: JSON.parse(JSON.stringify(DEFAULT_DATA)), corrupted: false };
    }
    
    let parsed = JSON.parse(raw);
    
    // Check if structure is severely broken
    if (!parsed || typeof parsed !== 'object') {
      return { data: null, corrupted: true, errorMsg: 'Data is not an object.' };
    }
    
    // Perform migrations if needed
    if (parsed.version !== CURRENT_VERSION) {
      parsed = migrate(parsed);
      saveData(parsed);
    }
    
    // Double check properties exist
    parsed.settings = parsed.settings || { ...DEFAULT_DATA.settings };
    parsed.transactions = parsed.transactions || [];
    
    return { data: parsed, corrupted: false };
  } catch (err) {
    console.error('Failed to parse localStorage data:', err);
    return { data: null, corrupted: true, errorMsg: err.message };
  }
}

/**
 * Saves data directly to localStorage.
 * @param {Object} data 
 */
export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Reset all data to defaults.
 */
export function resetData() {
  saveData(DEFAULT_DATA);
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

/**
 * Migrates data through versions sequentially.
 * @param {Object} oldData 
 * @returns {Object} newData
 */
function migrate(oldData) {
  let data = { ...oldData };
  let version = data.version || 0;
  
  if (version < 1) {
    // Migration logic for version 0 -> 1
    data.version = 1;
    data.settings = data.settings || { ...DEFAULT_DATA.settings };
    data.transactions = data.transactions || [];
    
    // Ensure all transactions have standard fields
    data.transactions = data.transactions.map(tx => ({
      id: tx.id || 'tx_' + Math.random().toString(36).substring(2, 9),
      type: tx.type === 'income' ? 'income' : 'expense',
      amount: parseFloat(tx.amount) || 0,
      category: tx.category || 'Other',
      date: tx.date || new Date().toISOString().split('T')[0],
      note: tx.note || '',
      paymentMethod: tx.paymentMethod || '',
      createdAt: tx.createdAt || new Date().toISOString(),
      updatedAt: tx.updatedAt || new Date().toISOString()
    }));
  }
  
  // Future versions would be handled as:
  // if (version < 2) { ... }
  
  return data;
}

/**
 * Validates a imported JSON database format.
 * Returns { valid: boolean, errors: Array<string> }
 * @param {Object} json 
 * @returns {Object}
 */
export function validateImportData(json) {
  const errors = [];
  
  if (!json || typeof json !== 'object') {
    return { valid: false, errors: ['Imported content must be a valid JSON object.'] };
  }
  
  // Validate Settings
  if (json.settings) {
    if (typeof json.settings !== 'object') {
      errors.push('Settings must be an object.');
    } else {
      if (json.settings.budget !== undefined && (typeof json.settings.budget !== 'number' || json.settings.budget < 0)) {
        errors.push('Budget must be a non-negative number.');
      }
      if (json.settings.startOfWeek && !['Mon', 'Sun'].includes(json.settings.startOfWeek)) {
        errors.push('Start of week must be either "Mon" or "Sun".');
      }
    }
  } else {
    errors.push('Missing settings object.');
  }
  
  // Validate Transactions
  if (json.transactions) {
    if (!Array.isArray(json.transactions)) {
      errors.push('Transactions must be an array.');
    } else {
      json.transactions.forEach((tx, idx) => {
        const prefix = `Transaction #${idx + 1}`;
        if (!tx.id || typeof tx.id !== 'string') {
          errors.push(`${prefix}: ID is missing or invalid.`);
        }
        if (!['income', 'expense'].includes(tx.type)) {
          errors.push(`${prefix}: Type must be "income" or "expense".`);
        }
        if (typeof tx.amount !== 'number' || tx.amount <= 0) {
          errors.push(`${prefix}: Amount must be a number greater than 0.`);
        }
        if (!tx.category || typeof tx.category !== 'string') {
          errors.push(`${prefix}: Category is required.`);
        }
        if (!tx.date || !/^\d{4}-\d{2}-\d{2}$/.test(tx.date)) {
          errors.push(`${prefix}: Date must be in YYYY-MM-DD format.`);
        }
        if (tx.note !== undefined && typeof tx.note !== 'string') {
          errors.push(`${prefix}: Note must be a string.`);
        }
        if (tx.paymentMethod !== undefined && typeof tx.paymentMethod !== 'string') {
          errors.push(`${prefix}: Payment method must be a string.`);
        }
      });
    }
  } else {
    errors.push('Missing transactions array.');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
