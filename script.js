const form = document.getElementById("expenseForm");
const monthlyContainer = document.getElementById("monthlyContainer");
const addExpenseBtn = document.getElementById("addExpenseBtn");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let salaries = JSON.parse(localStorage.getItem("salaries")) || {};
let editingId = null;
let salaryTargetMonth = null;
let formOpen = false;

function saveExpenses(){
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function saveSalaries(){
  localStorage.setItem("salaries", JSON.stringify(salaries));
}

// ── Change 4: Toggle + / - on the Add Expense button ──
function toggleAddExpense(){
  const container = document.getElementById("expenseFormContainer");
  formOpen = !formOpen;
  container.classList.toggle("hidden", !formOpen);

  // Update button label
  if(formOpen){
    addExpenseBtn.textContent = "− Add Expense";
  } else {
    addExpenseBtn.textContent = "+ Add Expense";
  }
}

// ── Change 3: Green success toast ──
function showSuccessToast(){
  const toast = document.getElementById("successToast");
  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      toast.classList.add("hidden");
      toast.style.opacity = "1";
    }, 400);
  }, 1500);
}

// ── Change 2: Sort months from latest to oldest ──
function groupByMonth(data){
  const grouped = {};
  data.forEach(expense => {
    const date = new Date(expense.date + "T00:00:00");
    const month = date.toLocaleString("default", {
      month:"long",
      year:"numeric"
    });
    if(!grouped[month]) grouped[month] = [];
    grouped[month].push(expense);
  });
  return grouped;
}

function sortMonthsLatestFirst(grouped){
  return Object.keys(grouped).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB - dateA;
  });
}

// ── Change 1: Table view under dropdowns ──
function createExpenseTable(data){
  if(data.length === 0){
    return `<p class="no-expenses">No expenses</p>`;
  }

  const rows = data.map(expense => `
    <tr>
      <td class="table-amount">₹${Number(expense.amount).toLocaleString()}</td>
      <td class="table-category">${expense.category}</td>
      <td class="table-date">${formatDate(expense.date)}</td>
      <td class="table-note" title="${expense.note || ''}">${expense.note || '—'}</td>
      <td>
        <div class="table-actions">
          <button class="edit-btn" onclick="editExpense('${expense.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteExpense('${expense.id}')">Del</button>
        </div>
      </td>
    </tr>
  `).join("");

  return `
    <table class="expense-table">
      <thead>
        <tr>
          <th>Amount</th>
          <th>Category</th>
          <th>Date</th>
          <th>Note</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function formatDate(dateStr){
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short" });
}

// ── Change 6: Salary modal helpers ──
function openSalaryModal(month, event){
  event.stopPropagation();
  salaryTargetMonth = month;
  document.getElementById("modalMonthLabel").textContent = month;
  const existing = salaries[month] || "";
  document.getElementById("salaryInput").value = existing;
  document.getElementById("salaryModal").classList.remove("hidden");
}

function closeSalaryModal(){
  document.getElementById("salaryModal").classList.add("hidden");
  salaryTargetMonth = null;
}

function saveSalary(){
  const val = parseFloat(document.getElementById("salaryInput").value);
  if(isNaN(val) || val <= 0){
    alert("Please enter a valid salary amount.");
    return;
  }
  salaries[salaryTargetMonth] = val;
  saveSalaries();
  closeSalaryModal();
  renderExpenses();
}

// ── Main render ──
function renderExpenses(){
  monthlyContainer.innerHTML = "";

  const grouped = groupByMonth(expenses);
  const sortedMonths = sortMonthsLatestFirst(grouped);

  sortedMonths.forEach(month => {
    const monthExpenses = grouped[month];

    const mainExpenses = monthExpenses.filter(e => e.person === "Main");
    const selfExpenses = monthExpenses.filter(e => e.person === "Self");

    const mainTotal = mainExpenses.reduce((sum,e) => sum + Number(e.amount), 0);
    const selfTotal = selfExpenses.reduce((sum,e) => sum + Number(e.amount), 0);
    const grandTotal = mainTotal + selfTotal;

    const monthId = month.replace(/\s/g,"");
    const salary = salaries[month];
    const remaining = salary !== undefined ? salary - grandTotal : null;

    const card = document.createElement("div");
    card.className = "month-card";

    // ── Change 6: Remaining salary row (only if salary set) ──
    const remainingHTML = remaining !== null ? `
      <div class="remaining-row">
        <span>Salary</span>
        <span>₹${Number(salary).toLocaleString()}</span>
      </div>
      <div class="remaining-row">
        <span>Remaining</span>
        <span class="${remaining >= 0 ? 'remaining-positive' : 'remaining-negative'}">
          ₹${Math.abs(remaining).toLocaleString()} ${remaining < 0 ? '(over budget)' : ''}
        </span>
      </div>
    ` : "";

    card.innerHTML = `
      <div class="month-header" onclick="toggleSection('${monthId}')">
        <div class="month-header-left">
          <h2>${month}</h2>
          <!-- Change 6: + icon to add salary -->
          <button class="add-salary-btn"
            onclick="openSalaryModal('${month}', event)"
            title="${salary ? 'Edit salary' : 'Add salary'}">
            ${salary ? '✏️' : '+'} Salary
          </button>
        </div>
        <span id="arrow-${monthId}">▼</span>
      </div>

      <div id="${monthId}" class="hidden">

        <!-- Summary block -->
        <div class="summary-block">
          <div class="total-row">
            <span>Main Total</span>
            <span>₹${mainTotal.toLocaleString()}</span>
          </div>
          <div class="total-row">
            <span>Self Total</span>
            <span>₹${selfTotal.toLocaleString()}</span>
          </div>
          ${remainingHTML}
        </div>

        <!-- Change 1: Main Expenses dropdown with table -->
        <div class="section-header"
          onclick="toggleSection('${monthId}-main', event)">
          <span>Main Expenses</span>
          <span id="arrow-${monthId}-main">▼</span>
        </div>
        <div id="${monthId}-main" class="hidden">
          ${createExpenseTable(mainExpenses)}
        </div>

        <!-- Change 1: Self Expenses dropdown with table -->
        <div class="section-header"
          onclick="toggleSection('${monthId}-self', event)">
          <span>Self Expenses</span>
          <span id="arrow-${monthId}-self">▼</span>
        </div>
        <div id="${monthId}-self" class="hidden">
          ${createExpenseTable(selfExpenses)}
        </div>

      </div>
    `;

    monthlyContainer.appendChild(card);
  });
}

function toggleSection(id, event){
  if(event) event.stopPropagation();
  const el = document.getElementById(id);
  if(!el) return;
  const isHidden = el.classList.toggle("hidden");

  // Update arrow indicator
  const arrow = document.getElementById("arrow-" + id);
  if(arrow) arrow.textContent = isHidden ? "▼" : "▲";
}

function deleteExpense(id){
  expenses = expenses.filter(e => e.id !== id);
  saveExpenses();
  renderExpenses();
}

function editExpense(id){
  const expense = expenses.find(e => e.id === id);
  editingId = id;

  document.getElementById("amount").value = expense.amount;
  document.getElementById("person").value = expense.person;
  document.getElementById("category").value = expense.category;
  document.getElementById("note").value = expense.note || "";
  document.getElementById("date").value = expense.date;

  // Open the form and update button label
  const container = document.getElementById("expenseFormContainer");
  container.classList.remove("hidden");
  formOpen = true;
  addExpenseBtn.textContent = "− Add Expense";

  window.scrollTo({ top:0, behavior:"smooth" });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const expenseData = {
    id: editingId || Date.now().toString(),
    amount: document.getElementById("amount").value,
    person: document.getElementById("person").value,
    category: document.getElementById("category").value,
    note: document.getElementById("note").value,
    date: document.getElementById("date").value
  };

  const isNew = !editingId;

  if(editingId){
    expenses = expenses.map(expense =>
      expense.id === editingId ? expenseData : expense
    );
    editingId = null;
  } else {
    expenses.push(expenseData);
  }

  saveExpenses();
  renderExpenses();
  form.reset();

  // Change 3: Show green toast only for new expenses
  if(isNew){
    showSuccessToast();
  }

  // Close form after saving
  const container = document.getElementById("expenseFormContainer");
  container.classList.add("hidden");
  formOpen = false;
  addExpenseBtn.textContent = "+ Add Expense";
});

// ── Change 5: Date placeholder fix ──
const dateInput = document.getElementById("date");
dateInput.addEventListener("change", () => {
  if(dateInput.value){
    dateInput.style.color = "#333";
  } else {
    dateInput.style.color = "#9ca3af";
  }
});
// Set initial placeholder color
dateInput.style.color = "#9ca3af";

renderExpenses();
