
const form = document.getElementById("expenseForm");
const expenseList = document.getElementById("expenseList");
const totalAmount = document.getElementById("totalAmount");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

function saveExpenses(){
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function renderExpenses(){
  expenseList.innerHTML = "";

  let total = 0;

  expenses.forEach((expense, index) => {
    total += Number(expense.amount);

    const li = document.createElement("li");

    li.innerHTML = `
      <div class="expense-info">
        <strong>₹${expense.amount} - ${expense.category}</strong>
        <small>${expense.note || ""}</small>
        <small>${expense.date}</small>
      </div>

      <button class="delete-btn" onclick="deleteExpense(${index})">
        Delete
      </button>
    `;

    expenseList.appendChild(li);
  });

  totalAmount.textContent = `₹${total}`;
}

function deleteExpense(index){
  expenses.splice(index,1);
  saveExpenses();
  renderExpenses();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const expense = {
    amount: document.getElementById("amount").value,
    category: document.getElementById("category").value,
    note: document.getElementById("note").value,
    date: document.getElementById("date").value
  };

  expenses.push(expense);

  saveExpenses();
  renderExpenses();

  form.reset();
});

renderExpenses();
