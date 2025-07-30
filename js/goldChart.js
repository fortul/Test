// goldChart.js
// Fetches historical GLD data and displays it using Chart.js.
// Allows user to select frequency (daily, monthly, yearly) and date range.

document.addEventListener('DOMContentLoaded', async () => {
  const freqSelect   = document.getElementById('freq');
  const startInput   = document.getElementById('start-date');
  const endInput     = document.getElementById('end-date');
  const updateButton = document.getElementById('update');
  const ctx          = document.getElementById('goldChart').getContext('2d');

  // Load raw data
  const response = await fetch('data/gld_data.json');
  const rawData  = await response.json();

  // Convert to Date objects
  const parsed = rawData.map(r => ({
    date: new Date(r.date),
    close: r.close
  }));

  // Default dates
  const minDate = parsed[0].date.toISOString().split('T')[0];
  const maxDate = parsed[parsed.length - 1].date.toISOString().split('T')[0];
  startInput.value = minDate;
  endInput.value   = maxDate;

  // Aggregation helpers
  const aggregate = (data, freq) => {
    const map = {};
    data.forEach(({ date, close }) => {
      let key;
      if (freq === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
      } else if (freq === 'yearly') {
        key = `${date.getFullYear()}`;
      } else {
        key = date.toISOString().split('T')[0];
      }
      if (!map[key] || date > map[key].date) {
        map[key] = { date, close };
      }
    });
    return Object.values(map)
      .sort((a, b) => a.date - b.date)
      .map(d => ({ date: d.date, close: d.close }));
  };

  // Initial chart instance
  let chart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'GLD Close (USD)', data: [] }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { type: 'time', time: { unit: 'month' } },
        y: { beginAtZero: false }
      },
      plugins: {
        legend: { display: true }
      }
    }
  });

  // Render function
  const render = () => {
    const freq  = freqSelect.value;
    const start = new Date(startInput.value);
    const end   = new Date(endInput.value);
    const slice = parsed.filter(r => r.date >= start && r.date <= end);
    const out   = aggregate(slice, freq);

    chart.data.labels   = out.map(o => o.date);
    chart.data.datasets[0].data = out.map(o => o.close);
    chart.update();
  };

  updateButton.addEventListener('click', render);

  // Draw initial
  render();
});
