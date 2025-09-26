const HISTORY_KEY = "coffeeOrderHistory";

// Prices for each drink
const PRICES = {
  "Espresso": 2.50,
  "Latte": 3.75,
  "Cappuccino": 3.50,
  "Iced Coffee": 4.00
};

// Calories for each drink
const CALORIES = {
  "Espresso": 5,
  "Latte": 150,
  "Cappuccino": 120,
  "Iced Coffee": 180
};

// list of drink names from Prices
const DRINKS = Object.keys(PRICES);

// Creates the dictionary for cart
let cart = [];

// Chart.js draw white background 
const WhiteBackgroundPlugin = {
  id: 'whiteBackground',
  beforeDraw: (chart) => {
    const ctx = chart.canvas.getContext('2d');
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ccc79c';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
};

// Read the history from LocalStorage
function loadOrderHistory() {
  const stored = localStorage.getItem(HISTORY_KEY);
  // If nothing was saved yet start by creating an empty array
  if (!stored) {
    return [];
  }

  // Try to convert the saved history from JSON text into an array
  // If fail return empty array instead
  try { 
    return JSON.parse(stored); 
  } catch { 
    return []; 
  }
}

// Add a new order to history and save
function saveOrderHistoryEntry(entry) {
  const hist = loadOrderHistory();
  hist.push(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
}

// Run the program after DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  const drinkSelect = document.getElementById("drink");
  const qtyInput = document.getElementById("qty");
  const addCoffee = document.getElementById("addCoffeeBtn");
  const totalPrice = document.getElementById("total");
  const orderForm = document.getElementById("orderForm");
  const result = document.getElementById("orderResult");
  const cartTable = document.getElementById("cartTable");
  const cartTableBody = cartTable.querySelector("tbody");

  // Set chart tos to null so that they can be created and updated continuously 
  let orderedCalChart = null;
  let drinksPieChart = null;

  // Render current cart rows, money calculations, and refresh charts
  function renderCart() {
    // Clear the table body first
    cartTableBody.innerHTML = "";
    let total = 0;

    // Loop through each coffee item currently in cart and calculate subtotal and total
    for (let i = 0; i < cart.length; i++) {
      const coffee = cart[i];
      const subtotal = coffee.price * coffee.qty;
      total += subtotal;

      // Create a new table row for each coffee item
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + coffee.name + "</td>" +
        "<td>" + coffee.price.toFixed(2) + "</td>" +
        "<td><input type='number' class='row-qty' data-index='" + i + "' min='0' value='" + coffee.qty + "'></td>" +
        "<td>" + subtotal.toFixed(2) + "</td>" +
        "<td><button type='button' class='remove' data-index='" + i + "'>✕</button></td>";

        // Add the new row to the table body
        cartTableBody.appendChild(tr);
    }

    // Update total price and refresh charts
    totalPrice.textContent = total.toFixed(2);
    updateCaloriesChartFromCart();
    updateDrinksPieChart();
  }

  // Add a new coffee or add to existing coffee button
  addCoffee.addEventListener("click", () => {
    const name = drinkSelect.value;
    let qty = parseInt(qtyInput.value, 10);

    // If user doesn't pick a drink they are forced to enter one first before they continue 
    if (!name) {
      alert("Please pick a drink first!");
      return;
    }

    // Invalid amounts like negative become zero
    if (!Number.isInteger(qty) || qty < 0) {
      qty = 0;
    }

    const price = PRICES[name];

    // If the coffee already exist, increase the qty instead of duplicating it
    let found = false;
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].name === name) {
        cart[i].qty += qty;
        found = true;
        break;
      }
    }

    // Else create a new row
    if (!found) {
      cart.push({name, price, qty});
    }

    // Remove any coffee that reached 0 qty
    let newCart = [];
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].qty > 0) {
        newCart.push(cart[i]);
      }
    }
    cart = newCart;

    renderCart();
  });

  // Change the input inside table
  cartTableBody.addEventListener("input", function(e) {
    if (!e.target.classList.contains("row-qty")) {
      return;
    }

    // Loop through each table to see which one has the changed input.
    let index = -1;
    let rows = cartTableBody.children;
    for (let i = 0; i < rows.length; i++) {
      let input = rows[i].querySelector(".row-qty");
      if (input === e.target) {
        index = i;
        break;
      }
    }

    // Make sure the value is positive if its empty or negative, set it to 0
    let newValue = e.target.value;
    if (newValue === "" || newValue < 0) {
      newValue = 0;
    }
    let newQty = Number(newValue);
    
    // Update the corresponding cart entry qty to the new qty
    cart[index].qty = newQty;

    // Go through cart again and only keep coffee with qty that is greater than 0
    let newCart = [];
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].qty > 0) {
        newCart.push(cart[i]);
      }
    }
    cart = newCart;

    // Re-render totals and charts
    renderCart();
  });
    
  // This function corresponds to the remove button on the coffee website
  cartTableBody.addEventListener("click", (e) => {
    if (!e.target.classList.contains("remove")) {
      return;
    }

    // Find the coffee row where the user clicked remove
    let index = -1;
    let rows = cartTableBody.children;
    for (let i = 0; i < rows.length; i++) {
      let button = rows[i].querySelector(".remove");
      if (button === e.target) {
        index = i;
        break;
      }
    }

    // If the correct row is found remove it from cart
    if (index >= 0) {
      cart.splice(index, 1);
    }


    renderCart();
  });

orderForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Stops the history from taking in empty orders.
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  // Get the customer's name and whatever they types in the custom note box.
  let name = document.getElementById("customer").value.trim();
  const custom = document.getElementById("custom").value.trim();
  const email = (document.querySelector("input[name='email']")?.value || "").trim();
  const statusEl = document.getElementById("orderStatus"); // <p id="orderStatus"></p>

  // Name is "Guest" if customer did not enter a name
  if (name === "") {
    name = "Guest";
  }

  // Create a reciept and calculate total
  let total = 0;
  for (const coffee of cart) {
    total += coffee.price * coffee.qty;
  }

  // Make a list of the coffee in the cart so it can be saved
  let coffeeList = [];
  for (let i = 0; i < cart.length; i++) {
    coffeeList.push({
      name: cart[i].name,
      qty: cart[i].qty,
      price: cart[i].price
    });
  }

  // Create the order for saving use ISO string to load from history later
  let orderToSave = {
    time: new Date().toISOString(),
    name: name,
    coffees: coffeeList,
    total: Number(total.toFixed(2))
  };

  // Only include custom note if provided
  if (custom.trim() !== "") {
    orderToSave.custom = custom;
  }

  saveOrderHistoryEntry(orderToSave);

  // Build the receipt for the email
  const receiptText = buildReceiptText(name, cart, total, custom);
  result.innerHTML = `<pre style="font-family:inherit; white-space:pre-wrap; margin:0;">${escapeHtml(receiptText)}</pre>`;

  // Build HTML for the email
  const receiptHtml =
    `<pre style="font-family:inherit;white-space:pre-wrap;margin:0;">` +
    escapeHtml(receiptText) +
    `</pre>`;

  // Capture charts as Base64 reuse your helper
  if (statusEl) statusEl.textContent = "Preparing charts…";
  const charts = await captureCharts();

  // Send email
  if (email) {
    if (statusEl) statusEl.textContent = "Sending email…";
    const ok = await sendReceiptEmail({ email, receiptHtml, charts });
    if (statusEl) statusEl.textContent = ok ? "Receipt sent ✅" : "Failed to send receipt ❌";
  }

  // Reset cart and form once order is submitted
  cart = [];
  renderCart();
});


  // If the customer press reset, they are asked if they are sure first.  If no stop reset.  If yes reset order from cart
  orderForm.addEventListener("reset", (e) => {
    const confirmation = confirm("Are you sure you want to clear your order?");

    if (!confirmation) {
      e.preventDefault();
      return;
    }

    cart = [];
    renderCart();
    result.textContent = "";
  });

  // Build a receipt text message
  function buildReceiptText(name, cart, total, custom) {
    // Build each line of the receipt
    let lines = "";
    for (const coffee of cart) {
      const subtotal = coffee.price * coffee.qty;
      lines += `- ${coffee.name} x ${coffee.qty} = subtotal $${subtotal.toFixed(2)}\n`;
    }

    // Build the full message
    let msg = 
      `Thank you, ${name}!\n` +
      `Your order:\n${lines}` +
      `Total: $${total.toFixed(2)}\n`;

    // Only include custom note if provided
    if (custom.trim() !== "") {
      msg += `Custom request: ${custom}\n`;
    }

    // Add closing message
    msg += `\nWe hope you enjoy your drinks!\nHave a great day!\n\n- Coffee Shop`;
    return msg;
  }

// Make chart memory effiecient and easier to email
function canvasToBase64(id, maxWidth = 800, quality = 0.7) {
  // Get the current chart's canvas if it exists.  If not return null
  const canvas = document.getElementById(id);
  if (!canvas) {
    return null;
  }

  // Use an offscreen canvas and downscale to keep email small
  const w0 = canvas.width || canvas.offsetWidth || 800;
  const h0 = canvas.height || canvas.offsetHeight || 400;
  const scale = Math.min(1, maxWidth / Math.max(1, w0));
  const w = Math.round(w0 * scale);
  const h = Math.round(h0 * scale);

  // Create a temporary canvas to render the downscaled image
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  off.getContext("2d").drawImage(canvas, 0, 0, w, h);
  return off.toDataURL("image/jpeg", quality);
}

// Pause code for a given time
function delay(milliseconds) { 
  // Return to use delay
  return new Promise(function(resolve) { 
    // Wait number of milliseconds then continue
    setTimeout(resolve, milliseconds); 
  });
}

// Async function to use chart images as Base64 strings
async function captureCharts() {
  // give Chart.js time to finish its animations
  await delay(200);
  const charts = {
    orderedCaloriesChart: canvasToBase64("orderedCaloriesChart"),
    drinksPieChart: canvasToBase64("drinksPieChart"),
  };

  // remove nulls
  Object.keys(charts).forEach(function(key) {
    if (charts[key] == null) {
      delete charts[key];
    }
  });

  // Return only charts that were found and converted
  return charts;
}

async function sendReceiptEmail({ email, receiptHtml, charts }) {
  try {
    const res = await fetch("/send-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, receiptHtml, charts })
    });
    return res.ok;
  } catch (e) {
    console.error("sendReceiptEmail error:", e);
    return false;
  }
}

  // Bar chart
  function CalorieChart() {
    const canvas = document.getElementById("calorieChart");
    if (!canvas) return;
    const labels = Object.keys(CALORIES);
    const data = labels.map(d => CALORIES[d]);
    new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Calories per Drink",
          data,
          backgroundColor: [
            "rgba(255, 0, 55, 1)",
            "rgba(4, 0, 255, 1)",
            "rgba(0, 255, 64, 1)",
            "rgba(255, 247, 0, 1)"
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: { 
          legend: { 
            display: false 
          } 
        },
        scales: {
          y: { 
            beginAtZero: true, 
            title: { 
              display: true, 
              text: "Calories" 
            } 
          },
          x: { 
            title: { 
              display: true, 
              text: "Drink" 
            } 
          }
        }
      }
    });
  }

  // Scatter Plot chart
  function CaloriesPriceScatter() {
    const canvas = document.getElementById("calPriceChart");
    if (!canvas) return;

    const labels = DRINKS.filter(d => CALORIES[d] != null);
    const points = labels.map(name => ({ x: CALORIES[name], y: PRICES[name], _name: name }));

    new Chart(canvas.getContext("2d"), {
      type: "scatter",
      data: { datasets: [{ label: "Drinks", data: points, pointRadius: 5 }] },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const point = ctx.raw;
                return `${point._name}: ${point.x} cal, $${point.y.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: "Calories" }, beginAtZero: true },
          y: { title: { display: true, text: "Price ($)" }, beginAtZero: true }
        }
      }
    });
  }

  function OrderedCaloriesChart() {
    const canvas = document.getElementById("orderedCaloriesChart");
    if (!canvas) return;
    const zeros = DRINKS.map(() => 0);
    orderedCalChart = new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: DRINKS,
        datasets: [{
          label: "Calories in Current Cart",
          data: zeros,
          backgroundColor: [
            "rgba(255, 0, 55, 1)",
            "rgba(4, 0, 255, 1)",
            "rgba(0, 255, 64, 1)",
            "rgba(255, 247, 0, 1)"
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: { 
          legend: { 
            display: false 
          },
          title: {
            display: true,
            text: 'Calories per Drink',
            color: "#000",
            font: { 
              size: 16,
              weight: "bold" 
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            title: { 
              display: true, 
              text: "Calories" 
            } 
          },
          x: { 
            title: { 
              display: true, 
              text: "Drink" 
            }
          }
        },
        layout: { padding: 10 }
      },
      plugins: [WhiteBackgroundPlugin]
    });
  }  


  // Update calories from chart
  function updateCaloriesChartFromCart() {
    if (!orderedCalChart) {
      return;
    }
    // Go through every drink and find total calories
    const totals = DRINKS.map(name => {
      const found = cart.find(it => it.name === name);
      const qty = found ? found.qty : 0;
      const cals = CALORIES[name] || 0;
      return qty * cals;
    });

    // Put new data into chart and refresh it
    orderedCalChart.data.datasets[0].data = totals;
    orderedCalChart.update();
  }

  // Pi chart
  function DrinksPieChart() {
    const canvas = document.getElementById("drinksPieChart");
    if (!canvas) return;
    const zeros = DRINKS.map(() => 0);
    drinksPieChart = new Chart(canvas.getContext("2d"), {
      type: "pie",
      data: {
        labels: DRINKS,
        datasets: [{
          label: "Drinks in Cart",
          data: zeros,
          backgroundColor: [
            "rgba(255, 0, 55, 1)",
            "rgba(4, 0, 255, 1)",
            "rgba(0, 255, 64, 1)",
            "rgba(255, 247, 0, 1)"
          ]
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
          title: {
            display: true,
            text: 'Drink Distribution',
            color: "#000",
            font: { size: 25, weight: "bold" }
          }
        },
        layout: { padding: 10 }
       },
      plugins: [WhiteBackgroundPlugin]
    });
  }
  function updateDrinksPieChart() {
    if (!drinksPieChart) return;
    const counts = DRINKS.map(name => {
      const found = cart.find(it => it.name === name);
      return found ? found.qty : 0;
    });
    drinksPieChart.data.datasets[0].data = counts;
    drinksPieChart.update();
  }

  // charts
  CalorieChart();
  CaloriesPriceScatter();
  OrderedCaloriesChart();
  DrinksPieChart();
});

// Escape HTML safely
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Build the reciept HTML
const receiptHtml = `
  <pre style="font-family:inherit; white-space:pre-wrap; margin:0;">
    ${escapeHtml(receiptText)}
  </pre>
`;

// Build the charts section of the email
let chartsHtml = "";
if (orderedCalChart) {
  chartsHtml += 
  `<p>
    <strong> Calories Chart:</strong><br><img src="${orderedCalChart.toBase64Image()}" style="max-width:100%;"/>
  </p>`;
}

if (drinksPieChart) {
  chartsHtml += 
  `<p>
    <strong>Drinks Pie Chart:</strong><br><img src="${drinksPieChart.toBase64Image()}" style="max-width:100%;"/>
  </p>`;
}

// COombine the reciept text and charts into one HTML
const fullHtml = receiptHtml + chartsHtml;

// Email the receipt with charts
sendReceiptEmail({ email, receiptHtml: fullHtml }, statusEl);

