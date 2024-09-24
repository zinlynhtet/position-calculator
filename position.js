const themeToggle = document.getElementById('themeToggle');
const { body } = document;
const form = document.getElementById('tradingForm');
const clearButton = document.getElementById('clearButton');
const resultsDiv = document.getElementById('results');
document.getElementById('chartContainer');
let pnlChart = null;

function updateChartTheme() {
  const isDarkMode = body.classList.contains('dark-mode');
  const textColor = isDarkMode ? '#fff' : '#333';

  pnlChart.options.scales.x.ticks.color = textColor;
  pnlChart.options.scales.y.ticks.color = textColor;
  pnlChart.options.scales.x.title.color = textColor;
  pnlChart.options.scales.y.title.color = textColor;
  pnlChart.options.plugins.legend.labels.color = textColor;

  if (isDarkMode) {
    pnlChart.options.scales.y.grid.color = 'rgba(255, 255, 255, 0.1)';
  } else {
    pnlChart.options.scales.y.grid.color = 'rgba(0, 0, 0, 0.1)';
  }

  pnlChart.update();
}
function createChart(prices, pnls) {
  const ctx = document.getElementById('pnlChart').getContext('2d');
  pnlChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: prices,
      datasets: [{
        label: 'PnL (USDT)',
        data: pnls,
        borderColor: '#f0b90b',
        backgroundColor: 'rgba(240, 185, 11, 0.2)',
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Price (USDT)',
          },
          grid: {
            display: false,
          },
          ticks: {
            callback(value) {
              return value.toFixed(2);
            },
          },
        },
        y: {
          title: {
            display: true,
            text: 'PnL (USDT)',
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
        },
      },
    },
  });
  updateChartTheme();
}

themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  if (pnlChart) {
    updateChartTheme();
  }
});

clearButton.addEventListener('click', () => {
  form.reset();
  resultsDiv.innerHTML = '';
  if (pnlChart) {
    pnlChart.data.labels = [];
    pnlChart.data.datasets[0].data = [];
    pnlChart.update();
  } else {
    createChart([], []);
  }
});

function calculateAndUpdateChart() {
  const positionType = document.getElementById('positionType').value;
  const entryPrice = parseFloat(document.getElementById('entryPrice').value);
  const stopLossPrice = parseFloat(document.getElementById('stopLossPrice').value);
  const takeProfitPrice = parseFloat(document.getElementById('takeProfitPrice').value);
  const positionSize = parseFloat(document.getElementById('positionSize').value);
  const leverage = parseFloat(document.getElementById('leverage').value);

  const maintenanceMarginRate = 0.005;
  const totalPositionSize = positionSize * leverage;
  const contractQuantity = totalPositionSize / entryPrice;

  let loss; let profit; let
    liquidationPrice;

  if (positionType === 'long') {
    loss = (entryPrice - stopLossPrice) * contractQuantity;
    profit = (takeProfitPrice - entryPrice) * contractQuantity;
    liquidationPrice = entryPrice * (1 - (1 / leverage) + maintenanceMarginRate);
  } else {
    loss = (stopLossPrice - entryPrice) * contractQuantity;
    profit = (entryPrice - takeProfitPrice) * contractQuantity;
    liquidationPrice = entryPrice * (1 + (1 / leverage) - maintenanceMarginRate);
  }

  const pnlPercentLoss = (loss / positionSize) * 100;
  const pnlPercentProfit = (profit / positionSize) * 100;

  resultsDiv.innerHTML = `
                <div>
                    <p><strong>Position Side:</strong> ${positionType.charAt(0).toUpperCase() + positionType.slice(1)}</p>
                    <p><strong>Total Position Size:</strong> ${totalPositionSize.toFixed(2)} USDT</p>
                    <p><strong>Contract Quantity:</strong> ${contractQuantity.toFixed(4)}</p>
                    <p><strong>Potential Loss:</strong> ${Math.abs(loss).toFixed(2)} USDT</p>
                </div>
                <div>
                    <p><strong>Potential Profit:</strong> ${profit.toFixed(2)} USDT</p>
                    <p><strong>PnL Percent (Loss):</strong> ${Math.abs(pnlPercentLoss).toFixed(2)}%</p>
                    <p><strong>PnL Percent (Profit):</strong> ${pnlPercentProfit.toFixed(2)}%</p>
                    <p><strong>Liquidation Price:</strong> ${liquidationPrice.toFixed(2)} USDT</p>
                </div>
            `;
  const entryStopDifference = Math.abs(entryPrice - stopLossPrice);
  const takeProfitDifference = Math.abs(takeProfitPrice - entryPrice);
  const priceRange = Math.max(entryStopDifference, takeProfitDifference) * 2;

  const minPrice = Math.max(0, entryPrice - priceRange);
  const maxPrice = entryPrice + priceRange;
  const step = priceRange / 100;

  const prices = [];
  const pnls = [];

  for (let price = minPrice; price <= maxPrice; price += step) {
    prices.push(price);
    let pnl;
    if (positionType === 'long') {
      pnl = (price - entryPrice) * contractQuantity;
    } else {
      pnl = (entryPrice - price) * contractQuantity;
    }
    pnls.push(pnl);
  }

  if (pnlChart) {
    pnlChart.data.labels = prices;
    pnlChart.data.datasets[0].data = pnls;
    pnlChart.update();
  } else {
    createChart(prices, pnls);
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  calculateAndUpdateChart();
});

// Initialize the chart with default values when the page loads
window.addEventListener('load', calculateAndUpdateChart);