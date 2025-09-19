// LocalStorage
const HISTORY_KEY = "coffeeOrderHistory";

// load saved orders.  If there is nothing return an empty array
function loadHistory() {
  const stored = localStorage.getItem(HISTORY_KEY);
  if (!stored) {
    return [];
  } 
  try { 
    return JSON.parse(stored); 
  } catch { 
    return []; 
  }
}

// save all orders back to localStorage
function saveHistory(orders) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(orders));
}

// Old orders uses entry.items new orders uses entry.coffee 
function getCoffees(entry) {
  if (Array.isArray(entry.coffees)) {
    return entry.coffees;
  }
  if (Array.isArray(entry.items)) {
    return entry.items;
  }
  return [];
}

// wipe all history after the user chooses to wipe out history
function clearHistory() {
  const ok = confirm("Are you sure you want to remove all history?");
  if (!ok) return;
  saveHistory([]);
  renderHistory();
  HistoryChart();
}

// Build the history table using coffee data in LocalStorage
function renderHistory() {
  const tbody = document.querySelector("#historyTable tbody");
  const record = loadHistory();
  tbody.innerHTML = "";

  // If there are no orders yet display that there are no orders yet
  if (record.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td>—</td><td>—</td><td>No past orders yet.</td><td>—</td>";
    tbody.appendChild(tr);
    return;
  }

  // Turn each saved order into a table row
  for (let i = 0; i < record.length; i++) {
    const entry = record[i];
    const coffees = getCoffees(entry);

    // Display a string of coffee that was ordered
    let coffeesText = "";
    for (let j = 0; j < coffees.length; j++) {
      const coffee = coffees[j];
      coffeesText += coffee.name + " x" + coffee.qty;
      if (j < coffees.length - 1) {
        coffeesText += ", ";
      }
    }

    // Make a new table row and fill it with the order's information
    // time, name of user, list of drinks, and total price
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + new Date(entry.time).toLocaleString() + "</td>" +
      "<td>" + (entry.name || "Guest") + "</td>" +
      "<td>" + coffeesText + "</td>" +
      "<td>$" + Number(entry.total || 0).toFixed(2) + "</td>";
    tbody.appendChild(tr);
  }
}

// Build a bar chart that displays the total amount of each drink that was ordered in this history
function HistoryChart() {
  const canvas = document.getElementById("historyChart");
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const record = loadHistory();
  const counts = {};

  // Create a total for each drink name using data given from orders
  for (let i = 0; i < record.length; i++) {
    const coffees = getCoffees(record[i]);
    for (let j = 0; j < coffees.length; j++) {
      const coffee = coffees[j];
      counts[coffee.name] = (counts[coffee.name] || 0) + (Number(coffee.qty) || 0);
    }
  }

  // Turn count objects into two matching arrays: one for names, one for totals
  const labels = Object.keys(counts);
  const data = labels.map(name => counts[name]);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "All-time drinks ordered",
        data: data,
        backgroundColor: "rgba(54, 162, 235, 0.6)"
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// initial render
window.addEventListener("DOMContentLoaded", () => {
  renderHistory();
  HistoryChart();

  document.getElementById("clearHistoryBtn").onclick = function() {
    clearHistory();
  };
});
