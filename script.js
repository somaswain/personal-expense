
const form = document.getElementById("expenseForm");
const monthlyContainer = document.getElementById("monthlyContainer");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let editingId = null;

function saveExpenses(){
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function toggleAddExpense(){
  document
    .getElementById("expenseFormContainer")
    .classList.toggle("hidden");
}

function groupByMonth(data){
  const grouped = {};

  data.forEach(expense => {
    const date = new Date(expense.date);

    const month = date.toLocaleString("default", {
      month:"long",
      year:"numeric"
    });

    if(!grouped[month]){
      grouped[month] = [];
    }

    grouped[month].push(expense);
  });

  return grouped;
}

function createExpenseCards(data){

  if(data.length === 0){
    return "<p style='margin-top:10px'>No expenses</p>";
  }

  return data.map(expense => `
    <div class="expense-card">

      <div class="expense-top">

        <div>
          <div class="expense-amount">
            ₹${expense.amount}
          </div>

          <div class="expense-category">
            ${expense.category}
          </div>
        </div>

        <button class="options-btn"
          onclick="toggleOptions('${expense.id}')">
          ⋮
        </button>

      </div>

      <div class="expense-note">
        ${expense.note || ""}
      </div>

      <div class="expense-date">
        ${expense.date}
      </div>

      <div class="options-menu"
        id="options-${expense.id}">

        <button class="edit-btn"
          onclick="editExpense('${expense.id}')">
          Edit
        </button>

        <button class="delete-btn"
          onclick="deleteExpense('${expense.id}')">
          Delete
        </button>

      </div>

    </div>
  `).join("");
}

function renderExpenses(){

  monthlyContainer.innerHTML = "";

  const grouped = groupByMonth(expenses);

  Object.keys(grouped).reverse().forEach(month => {

    const monthExpenses = grouped[month];

    const mainExpenses = monthExpenses.filter(
      e => e.person === "Main"
    );

    const selfExpenses = monthExpenses.filter(
      e => e.person === "Self"
    );

    const mainTotal = mainExpenses.reduce(
      (sum,e) => sum + Number(e.amount),0
    );

    const selfTotal = selfExpenses.reduce(
      (sum,e) => sum + Number(e.amount),0
    );

    const monthId = month.replace(/\s/g,"");

    const card = document.createElement("div");
    card.className = "month-card";

    card.innerHTML = `
      <div class="month-header"
        onclick="toggleSection('${monthId}')">

        <h2>${month}</h2>
        <span>▼</span>

      </div>

      <div id="${monthId}" class="hidden">

        <div class="total-row">
          <span>Main Total</span>
          <span>₹${mainTotal}</span>
        </div>

        <div class="total-row">
          <span>Self Total</span>
          <span>₹${selfTotal}</span>
        </div>

        <div class="section-header"
          onclick="toggleSection('${monthId}-main')">

          <span>Main Expenses</span>
          <span>▼</span>

        </div>

        <div id="${monthId}-main" class="hidden">
          ${createExpenseCards(mainExpenses)}
        </div>

        <div class="section-header"
          onclick="toggleSection('${monthId}-self')">

          <span>Self Expenses</span>
          <span>▼</span>

        </div>

        <div id="${monthId}-self" class="hidden">
          ${createExpenseCards(selfExpenses)}
        </div>

      </div>
    `;

    monthlyContainer.appendChild(card);
  });
}

function toggleSection(id){
  event.stopPropagation();
  document.getElementById(id).classList.toggle("hidden");
}

function toggleOptions(id){
  const menu = document.getElementById(`options-${id}`);

  if(menu.style.display === "flex"){
    menu.style.display = "none";
  } else {
    menu.style.display = "flex";
  }
}

function deleteExpense(id){

  expenses = expenses.filter(
    expense => expense.id !== id
  );

  saveExpenses();
  renderExpenses();
}

function editExpense(id){

  const expense = expenses.find(
    e => e.id === id
  );

  editingId = id;

  document.getElementById("amount").value = expense.amount;
  document.getElementById("person").value = expense.person;
  document.getElementById("category").value = expense.category;
  document.getElementById("note").value = expense.note;
  document.getElementById("date").value = expense.date;

  document
    .getElementById("expenseFormContainer")
    .classList.remove("hidden");

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });
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

  if(editingId){

    expenses = expenses.map(expense =>
      expense.id === editingId
        ? expenseData
        : expense
    );

    editingId = null;

  } else {

    expenses.push(expenseData);

  }

  saveExpenses();

  renderExpenses();

  form.reset();
});

renderExpenses();
