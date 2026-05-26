
const form = document.getElementById("expenseForm");
const monthlyContainer = document.getElementById("monthlyContainer");
const totalAmount = document.getElementById("totalAmount");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

function saveExpenses(){
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function groupByMonth(data){
  const grouped = {};

  data.forEach(expense => {
    const date = new Date(expense.date);
    const month = date.toLocaleString("default", {
      month: "long",
      year: "numeric"
    });

    if(!grouped[month]){
      grouped[month] = [];
    }

    grouped[month].push(expense);
  });

  return grouped;
}

function createTable(data){
  if(data.length === 0){
    return "<p>No expenses</p>";
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Amount</th>
          <th>Category</th>
          <th>Note</th>
          <th>Date</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        ${data.map((expense, index) => `
          <tr>
            <td>₹${expense.amount}</td>
            <td>${expense.category}</td>
            <td>${expense.note || "-"}</td>
            <td>${expense.date}</td>
            <td>
              <button class="delete-btn"
                onclick="deleteExpense('${expense.id}')">
                Delete
              </button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderExpenses(){

  monthlyContainer.innerHTML = "";

  let total = 0;

  expenses.forEach(expense => {
    total += Number(expense.amount);
  });

  totalAmount.textContent = `₹${total}`;

  const grouped = groupByMonth(expenses);

  Object.keys(grouped).reverse().forEach(month => {

    const monthExpenses = grouped[month];

    const selfExpenses = monthExpenses.filter(
      e => e.person === "Self"
    );

    const momExpenses = monthExpenses.filter(
      e => e.person === "Mom"
    );

    const card = document.createElement("div");
    card.className = "month-card";

    const contentId = month.replace(/\s/g, "");

    card.innerHTML = `
      <div class="month-header"
        onclick="toggleMonth('${contentId}')">
        <h2>${month}</h2>
        <span>▼</span>
      </div>

      <div id="${contentId}" class="hidden">

        <h3 class="section-title">Self Expenses</h3>
        ${createTable(selfExpenses)}

        <h3 class="section-title">Mom Expenses</h3>
        ${createTable(momExpenses)}

      </div>
    `;

    monthlyContainer.appendChild(card);
  });
}

function toggleMonth(id){
  document.getElementById(id).classList.toggle("hidden");
}

function deleteExpense(id){
  expenses = expenses.filter(expense => expense.id !== id);

  saveExpenses();
  renderExpenses();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const expense = {
    id: Date.now().toString(),
    amount: document.getElementById("amount").value,
    category: document.getElementById("category").value,
    note: document.getElementById("note").value,
    date: document.getElementById("date").value,
    person: document.getElementById("person").value
  };

  expenses.push(expense);

  saveExpenses();
  renderExpenses();

  form.reset();
});

renderExpenses();
