// goldChart.js
// This script fetches historical GLD data from a local JSON file and displays it
// using Chart.js. Users can change the frequency (daily, monthly, yearly) and
// select custom date ranges.

document.addEventListener('DOMContentLoaded', async () => {
  const freqSelect = document.getElementById('freq');
  const startInput = document.getElementById('start-date');
  const endInput = document.getElementById('end-date');
  const updateBtn = document.getElementById('updateChart');

  let rawData = [];
  let chart;

  // Fetch data from JSON file
  async function loadData() {
    try {
      const response = await fetch('data/gld_data.json');
      const json = await response.json();
      // Convert dates to Date objects and numbers
      rawData = json.map(item => ({
        date: new Date(item.date),
        close: Number(item.close)
      }));
      // Sort data by date ascending
      rawData.sort((a, b) => a.date - b.date);
      // Initialize date inputs
      const minDate = rawData[0].date;
      const maxDate = rawData[rawData.length - 1].date;
      startInput.value = minDate.toISOString().split('T')[0];
      endInput.value = maxDate.toISOString().split('T')[0];
      startInput.min = minDate.toISOString().split('T')[0];
      startInput.max = maxDate.toISOString().split('T')[0];
      endInput.min = minDate.toISOString().split('T')[0];
      endInput.max = maxDate.toISOString().split('T')[0];
      // Create initial chart
      const ctx = document.getElementById('goldChart').getContext('2d');
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'GLD Close Price (USD)',
            data: [],
            borderColor: '#d4af37',
            backgroundColor: 'rgba(212, 175, 55, 0.2)',
            tension: 0.1,
            pointRadius: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Date'
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Price (USD)'
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          }
        }
      });
      // Initial update
      updateChart();
    } catch (err) {
      console.error('Error loading data', err);
    }
  }

  // Aggregate data by month or year
  function aggregateData(freq, startDate, endDate) {
    const filtered = rawData.filter(item => item.date >= startDate && item.date <= endDate);
    if (freq === 'daily') {
      return filtered.map(item => ({ label: item.date.toISOString().split('T')[0], value: item.close }));
    }
    const groups = {};
    filtered.forEach(item => {
      let key;
      if (freq === 'monthly') {
        const y = item.date.getFullYear();
        const m = String(item.date.getMonth() + 1).padStart(2, '0');
        key = `${y}-${m}`;
      } else if (freq === 'yearly') {
        key = String(item.date.getFullYear());
      }
      if (!groups[key]) groups[key] = { sum: 0, count: 0 };
      groups[key].sum += item.close;
      groups[key].count += 1;
    });
    const aggregated = Object.keys(groups).sort().map(key => ({
      label: key,
      value: +(groups[key].sum / groups[key].count).toFixed(2)
    }));
    return aggregated;
  }

  // Update chart based on selections
  function updateChart() {
    const freq = freqSelect.value;
    const startDate = new Date(startInput.value);
    const endDate = new Date(endInput.value);
    if (startDate > endDate) {
      alert('Start date must be before end date');
      return;
    }
    const aggregated = aggregateData(freq, startDate, endDate);
    // Update data
    chart.data.labels = aggregated.map(item => item.label);
    chart.data.datasets[0].data = aggregated.map(item => item.value);
    // Update Y axis label depending on frequency
    if (freq === 'daily') {
      chart.data.datasets[0].label = 'GLD Close Price (USD) – Daily';
    } else if (freq === 'monthly') {
      chart.data.datasets[0].label = 'GLD Average Close Price (USD) – Monthly';
    } else if (freq === 'yearly') {
      chart.data.datasets[0].label = 'GLD Average Close Price (USD) – Yearly';
    }
    chart.update();
  }

  updateBtn.addEventListener('click', updateChart);

  // Load data on page load
  loadData();
});