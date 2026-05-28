<!--
PLAN OF WORK:
1. Scaffold storage.js (versioned scheme, migrations) & utils.js (formatting, sanitization, SVG icon helper).
2. Create index.html (semantic tags, main tabs, modals, accessibility tags).
3. Create styles.css (matte black tokens, responsive grid, visual states).
4. Implement app.js (state coordination, form validation, CRUD logic, 5-second undo toast).
5. Build SVG-based charts (Income/Expense donut, cumulative spend line chart) dynamically in JS.
6. Build filters, text search, sorting, and grouped transaction listing with subtotals.
7. Integrate budget triggers (warnings at >80% and >100%).
8. Write data tools (CSV export, JSON schema validator, confirm-reset).
9. Make accessibility adjustments (keyboard traps in modals, Escape shortcut, focus ring offsets).
10. Verify everything using manual checklist.
-->

# Vesper - Matte Black Personal Expense Tracker

Vesper is a premium, offline-capable, responsive personal expense tracker designed using modern vanilla HTML5, CSS3, and JavaScript (ES2020+). It features a sleek matte-black design system, secure local data storage, intuitive dashboards, and robust transaction management.

## Feature List

1. **Transactions CRUD**: Log and edit expenses or income with fields for amount, category, date, optional note, and payment method. Supports transaction deletion with a 5-second undo snackbar.
2. **Dashboard Analytics**:
   - Monthly summary cards for Income, Expenses, and Net Savings.
   - Dynamic SVG Category breakdown (donut chart) with Top Categories + "Other" grouping.
   - Dynamic SVG spend trends showing daily/cumulative expenses.
3. **Transaction Ledger**:
   - Interactive list sorted by date (descending) or amount.
   - Multi-filtering by date range, category, and type.
   - Text search across transaction notes.
   - Date-grouped transactions with daily sub-totals.
4. **Budget Management**:
   - Single-input monthly budget setting.
   - Interactive progress bar indicating percentage of budget spent.
   - Contextual warning triggers at 80% (amber alert) and 100% (red alert).
5. **Data Tools**:
   - Export ledger as a `.csv` file.
   - Import history from `.json` files with robust validation checks and descriptive error messages.
   - Deep database purge with a double-confirmation modal.
6. **Settings**:
   - Configurable currency symbol (default: ₹).
   - Intl-based number formatting.
   - Toggle to change week start (Monday vs. Sunday).

---

## How to Run

Vesper is built entirely with vanilla web technologies, requiring no compile or build steps.
To run the app:
1. Double-click the `index.html` file to open it directly in any modern browser.
2. Alternatively, run a simple local web server in the project directory:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server -p 8000
   ```
3. Open `http://localhost:8000` in your web browser.

---

## Data Schema & Storage Versioning

All data is stored locally in the browser under the localStorage key `"expenseTracker:data"`.

### Data Schema
```json
{
  "version": 1,
  "settings": {
    "currency": "INR",
    "currencySymbol": "₹",
    "startOfWeek": "Mon",
    "budget": 50000
  },
  "transactions": [
    {
      "id": "tx_2a4d9b10-e7bc",
      "type": "expense",
      "amount": 250.75,
      "category": "Food",
      "date": "2026-05-26",
      "note": "Lunch at cafe",
      "paymentMethod": "UPI",
      "createdAt": "2026-05-26T16:22:00.000Z",
      "updatedAt": "2026-05-26T16:22:00.000Z"
    }
  ]
}
```

### Storage Migration
Vesper features built-in defensive migrations. When updating schemas:
1. The app reads the stored JSON version.
2. If `version` is less than the current runtime version, it executes sequential migration scripts.
3. If JSON is unparseable or corrupted, it triggers a recovery modal offering a safe fallback reset.

---

## Manual Test Checklist

Use these steps to manually verify app functionality:

### 1. Verification of Clean Load
- [ ] Open the app. Confirm the page displays the dark UI.
- [ ] Check console (`F12`) to ensure zero errors are printed.
- [ ] Ensure default dashboard metrics read `₹0.00` and charts show empty states.

### 2. Transaction CRUD and Undo Delete
- [ ] Open the "Add Transaction" modal/drawer.
- [ ] Type `0` or negative numbers in amount. Click save. Confirm validation warning.
- [ ] Add an expense: Amount `150`, Category `Food`, Date `Today`, Note `Lunch`, Payment `Card`. Click Save. Confirm transaction is logged, card updates, and chart renders a slice.
- [ ] Click on the transaction to open the Edit Drawer. Change category to `Shopping`, click Save. Check that the ledger and charts update immediately.
- [ ] Click Delete in the edit drawer.
- [ ] Verify the bottom Snackbar appears: `"Transaction deleted."` with an `"Undo"` button.
- [ ] Click `"Undo"` within 5 seconds. Confirm transaction reappears in the ledger.
- [ ] Delete again, wait 6 seconds. Verify snackbar fades and transaction is permanently removed.

### 3. Budget Limits
- [ ] Navigate to Settings. Set Monthly Budget to `1000`.
- [ ] Create an expense of `850`. Go to Dashboard. Verify the progress indicator shows `85%` and shifts to an Amber (warning) theme.
- [ ] Create an expense of `200`. Verify progress shows `105%` and shifts to a Red (danger) theme.

### 4. Search and Filters
- [ ] Create 3 transactions: Expense `100` (Note: "Rent payment"), Expense `50` (Note: "Groceries"), Income `500` (Note: "Freelance").
- [ ] Type `"Groceries"` in the search bar. Check that only the groceries transaction shows.
- [ ] Filter by Type: `"Income"`. Check that only the Freelance transaction shows.
- [ ] Filter by Date: Select a range excluding today. Confirm empty state displays with a CTA.

### 5. Import, Export & Reset
- [ ] Click "Export to CSV" in settings. Open the generated file and verify header + transaction columns.
- [ ] Click "Reset All Data" in settings. Confirm the confirmation modal appears. Press Cancel (assert no change). Press Reset again and confirm. Confirm local storage is empty and dashboard resets.
- [ ] Copy a sample valid JSON schema and import it. Assert that records are successfully restored.
- [ ] Attempt importing a malformed text file. Verify readable error messages.

### 6. Accessibility Checks
- [ ] Press `Tab` to navigate through the entire page. Ensure that focus outline highlights form inputs and buttons clearly.
- [ ] Open the Add Transaction drawer. Press `Escape` and verify the drawer closes.
- [ ] Verify focus is trapped inside the drawer while open, and restored to the trigger button when closed.

---

## Future Improvements

1. **Category Budgets:** Setting separate budget targets per category (e.g. food vs entertainment).
2. **Recurring Transactions:** Automate monthly logs like rent or subscriptions.
3. **Advanced Visualizations:** Multi-month bar comparisons and cash flow forecasting.
4. **Data Syncing:** Encrypted sync with personal cloud accounts (Google Drive / WebDAV).
