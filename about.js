// Make the chart for orders throughout the day
function initOrdersChart() {
  // get the canvas element
  let canvas = document.getElementById("ordersChart");
  if (!canvas) {
    return; // stop if no canvas
  }

  // set up the labels (times of the day)
  let labels = ["8 AM","9 AM","10 AM","11 AM","12 PM","1 PM","2 PM","3 PM","4 PM"];

  // set up the data (number of orders at each time)
  let data = [5, 9, 14, 20, 25, 18, 15, 10, 6];

  // get the drawing context
  let ctx = canvas.getContext("2d");

  // make the line chart
  let chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Orders Over Time",
        data: data,
        tension: 0.3,
        fill: true
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
            text: "Orders"
          }
        },
        x: {
          title: {
            display: true,
            text: "Time of Day"
          }
        }
      }
    }
  });
}

initOrdersChart();
