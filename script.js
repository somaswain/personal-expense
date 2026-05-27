// ── State ──
let expenses   = JSON.parse(localStorage.getItem("expenses"))  || [];
let salaries   = JSON.parse(localStorage.getItem("salaries"))  || {};
let editingId  = null;
let formOpen   = false;
let activeMenuId = null;   // expense id whose options menu is open
let activeMenuEl = null;   // the trigger button element

// ── Persistence ──
function saveExpenses(){ localStorage.setItem("expenses", JSON.stringify(expenses)); }
function saveSalaries(){ localStorage.setItem("salaries", JSON.stringify(salaries)); }

// ── Toggle Add Expense form (Change: +/− label) ──
function toggleAddExpense(){
  const container = document.getElementById("expenseFormContainer");
  formOpen = !formOpen;
  container.classList.toggle("hidden", !formOpen);
  const btn = document.getElementById("addExpenseBtn");
  document.getElementById("addBtnIcon").textContent = formOpen ? "−" : "+";
  btn.style.borderRadius = formOpen ? "16px 16px 0 0" : "16px";
}

// ── Toast ──
function showToast(){
  const t = document.getElementById("successToast");
  t.classList.remove("hidden");
  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => { t.classList.add("hidden"); t.style.opacity = "1"; }, 350);
  }, 1600);
}

// ── Date input: colour when has value ──
const dateInput = document.getElementById("date");
dateInput.addEventListener("change", () => {
  dateInput.classList.toggle("has-value", !!dateInput.value);
});

// ── Group & sort months ──
function groupByMonth(data){
  const g = {};
  data.forEach(e => {
    const d     = new Date(e.date + "T00:00:00");
    const month = d.toLocaleString("default", { month:"long", year:"numeric" });
    if(!g[month]) g[month] = [];
    g[month].push(e);
  });
  return g;
}

function sortedMonths(grouped){
  return Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a));
}

// ── Format date ──
function fmt(dateStr){
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short" });
}

// ── Table (no category, options icon) ──
function createTable(data){
  if(!data.length) return `<p class="no-expenses">No expenses yet</p>`;

  const rows = data.map(e => `
    <tr>
      <td class="td-amount">₹${Number(e.amount).toLocaleString()}</td>
      <td class="td-date">${fmt(e.date)}</td>
      <td class="td-note" title="${e.note || ''}">${e.note || '—'}</td>
      <td class="td-options">
        <button class="options-trigger"
          onclick="openMenu('${e.id}', this, event)"
          aria-label="Options">⋯</button>
      </td>
    </tr>
  `).join("");

  return `
    <table class="expense-table">
      <thead>
        <tr>
          <th>Amount</th>
          <th>Date</th>
          <th>Note</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ── Floating Options Menu ──
function openMenu(id, btn, event){
  event.stopPropagation();

  // If already open for this id, close it
  if(activeMenuId === id){
    closeMenu();
    return;
  }

  activeMenuId = id;
  activeMenuEl = btn;

  const menu = document.getElementById("optionsMenu");
  menu.classList.remove("hidden");

  // Position near the button
  const rect = btn.getBoundingClientRect();
  const menuW = 140;
  let left = rect.right - menuW;
  let top  = rect.bottom + 6 + window.scrollY;

  // Keep within viewport
  if(left < 8) left = 8;
  if(left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8;

  menu.style.left = left + "px";
  menu.style.top  = top  + "px";
}

function closeMenu(){
  document.getElementById("optionsMenu").classList.add("hidden");
  activeMenuId = null;
  activeMenuEl = null;
}

function handleEdit(){
  if(!activeMenuId) return;
  closeMenu();
  editExpense(activeMenuId);
}

function handleDelete(){
  if(!activeMenuId) return;
  const id = activeMenuId;
  closeMenu();
  deleteExpense(id);
}

// Close menu on outside click
document.addEventListener("click", (e) => {
  if(activeMenuId && !document.getElementById("optionsMenu").contains(e.target)){
    closeMenu();
  }
});

// ── Salary modal ──
let salaryTargetMonth = null;

function openSalaryModal(month, event){
  event.stopPropagation();
  salaryTargetMonth = month;
  document.getElementById("modalMonthLabel").textContent = month;
  document.getElementById("salaryInput").value = salaries[month] || "";
  document.getElementById("salaryModal").classList.remove("hidden");
}

function closeSalaryModal(){
  document.getElementById("salaryModal").classList.add("hidden");
  salaryTargetMonth = null;
}

function saveSalary(){
  const val = parseFloat(document.getElementById("salaryInput").value);
  if(isNaN(val) || val <= 0){ alert("Enter a valid salary."); return; }
  salaries[salaryTargetMonth] = val;
  saveSalaries();
  closeSalaryModal();
  renderExpenses();
}

// ── Render ──
function renderExpenses(){
  const container = document.getElementById("monthlyContainer");
  container.innerHTML = "";

  const grouped = groupByMonth(expenses);
  const months  = sortedMonths(grouped);

  months.forEach(month => {
    const all  = grouped[month];
    const main = all.filter(e => e.person === "Main");
    const self = all.filter(e => e.person === "Self");
    const mainTotal  = main.reduce((s,e) => s + Number(e.amount), 0);
    const selfTotal  = self.reduce((s,e) => s + Number(e.amount), 0);
    const grandTotal = mainTotal + selfTotal;

    const monthId  = month.replace(/\s/g,"");
    const salary   = salaries[month];
    const remaining = salary !== undefined ? salary - grandTotal : null;

    const hasSalary = salary !== undefined;

    const remainingHTML = remaining !== null ? `
      <div class="divider"></div>
      <div class="remaining-row">
        <span>Salary</span>
        <span>₹${Number(salary).toLocaleString()}</span>
      </div>
      <div class="remaining-row">
        <span>Remaining</span>
        <span class="${remaining >= 0 ? 'pos' : 'neg'}">
          ${remaining < 0 ? '−' : ''}₹${Math.abs(remaining).toLocaleString()}
        </span>
      </div>
    ` : "";

    const card = document.createElement("div");
    card.className = "month-card";

    card.innerHTML = `
      <div class="month-header" onclick="toggleSection('${monthId}')">
        <div class="month-header-left">
          <span class="month-title">${month}</span>
          <button
            class="salary-tag ${hasSalary ? 'salary-tag-set' : 'salary-tag-add'}"
            onclick="openSalaryModal('${month}', event)">
            ${hasSalary ? '✎ Salary' : '+ Salary'}
          </button>
        </div>
        <span class="chevron" id="chev-${monthId}">▾</span>
      </div>

      <div id="${monthId}" class="hidden">
        <div class="summary-block">
          <div class="total-row"><span>Main</span><span>₹${mainTotal.toLocaleString()}</span></div>
          <div class="total-row"><span>Self</span><span>₹${selfTotal.toLocaleString()}</span></div>
          ${remainingHTML}
        </div>

        <div class="section-header" onclick="toggleSection('${monthId}-main', event)">
          <span>Main Expenses</span>
          <span class="chevron" id="chev-${monthId}-main">▾</span>
        </div>
        <div id="${monthId}-main" class="hidden">
          ${createTable(main)}
        </div>

        <div class="section-header" onclick="toggleSection('${monthId}-self', event)">
          <span>Self Expenses</span>
          <span class="chevron" id="chev-${monthId}-self">▾</span>
        </div>
        <div id="${monthId}-self" class="hidden">
          ${createTable(self)}
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function toggleSection(id, event){
  if(event) event.stopPropagation();
  const el = document.getElementById(id);
  if(!el) return;
  const nowHidden = el.classList.toggle("hidden");
  const chev = document.getElementById("chev-" + id);
  if(chev){
    chev.textContent = nowHidden ? "▾" : "▴";
    chev.classList.toggle("open", !nowHidden);
  }
}

// ── CRUD ──
function deleteExpense(id){
  expenses = expenses.filter(e => e.id !== id);
  saveExpenses();
  renderExpenses();
}

function editExpense(id){
  const e = expenses.find(x => x.id === id);
  if(!e) return;
  editingId = id;
  document.getElementById("amount").value   = e.amount;
  document.getElementById("person").value   = e.person;
  document.getElementById("category").value = e.category;
  document.getElementById("note").value     = e.note || "";
  document.getElementById("date").value     = e.date;
  dateInput.classList.add("has-value");

  const container = document.getElementById("expenseFormContainer");
  container.classList.remove("hidden");
  formOpen = true;
  document.getElementById("addBtnIcon").textContent = "−";
  window.scrollTo({ top:0, behavior:"smooth" });
}

document.getElementById("expenseForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = {
    id:       editingId || Date.now().toString(),
    amount:   document.getElementById("amount").value,
    person:   document.getElementById("person").value,
    category: document.getElementById("category").value,
    note:     document.getElementById("note").value,
    date:     document.getElementById("date").value
  };

  const isNew = !editingId;

  if(editingId){
    expenses = expenses.map(x => x.id === editingId ? data : x);
    editingId = null;
  } else {
    expenses.push(data);
  }

  saveExpenses();
  renderExpenses();
  e.target.reset();
  dateInput.classList.remove("has-value");

  if(isNew) showToast();

  // Close form
  document.getElementById("expenseFormContainer").classList.add("hidden");
  formOpen = false;
  document.getElementById("addBtnIcon").textContent = "+";
  document.getElementById("addExpenseBtn").style.borderRadius = "16px";
});

// ── Export ──
function exportData(){
  const payload = {
    exportedAt: new Date().toISOString(),
    expenses,
    salaries
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `expense-tracker-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Import ──
function triggerImport(){
  document.getElementById("importFile").click();
}

function importData(event){
  const file = event.target.files[0];
  if(!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if(!Array.isArray(data.expenses)){
        alert("Invalid backup file — could not find expenses.");
        return;
      }

      const confirmMsg = `Import ${data.expenses.length} expense(s)?\n\nThis will MERGE with your existing data (duplicates are skipped).`;
      if(!confirm(confirmMsg)) return;

      // Merge — skip if id already exists
      const existingIds = new Set(expenses.map(x => x.id));
      const newOnes = data.expenses.filter(x => !existingIds.has(x.id));
      expenses = [...expenses, ...newOnes];

      // Merge salaries (imported values win for that month)
      if(data.salaries && typeof data.salaries === "object"){
        salaries = { ...salaries, ...data.salaries };
      }

      saveExpenses();
      saveSalaries();
      renderExpenses();

      alert(`✅ Imported ${newOnes.length} new expense(s) successfully!`);
    } catch(err){
      alert("Failed to read file. Make sure it's a valid backup JSON.");
    }
  };
  reader.readAsText(file);

  // Reset so same file can be imported again if needed
  event.target.value = "";
}

// ── Init ──
renderExpenses();
