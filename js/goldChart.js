// js/goldChart.js
// Fully self‑contained: waits for DOM, sizes canvas, then builds & updates the Chart.

// 1. Wait for the DOM
document.addEventListener('DOMContentLoaded', async () => {
  // 2. Grab elements
  const freqSelect   = document.getElementById('freq');
  const startInput   = document.getElementById('start-date');
  const endInput     = document.getElementById('end-date');
  const updateButton = document.getElementById('update');
  const container    = document.querySelector('.chart-container');
  const canvas       = document.getElementById('goldChart');

  // 3. Force the canvas to match its container’s computed height
  const resizeCanvas = () => {
    const style = getComputedStyle(container);
    const h = parseFloat(style.height);
    canvas.height = h;           // direct pixel height
    canvas.style.height = `${h}px`;
  };
  resizeCanvas();

  // 4. Fetch and parse data
  const resp = await fetch('data/gld_data.json');
  const raw  = await resp.json();
  const parsed = raw.map(r => ({
    date: new Date(r.date),
    close: r.close
  }));

  // 5. Initialize date inputs
  const minDate = parsed[0].date.toISOString().split('T')[0];
  const maxDate = parsed[parsed.length - 1].date.toISOString().split('T')[0];
  startInput.value = minDate;
  endInput.value   = maxDate;

  // 6. Helper to aggregate
  const aggregate = (data, freq) => {
    const map = {};
    data.forEach(({date, close}) => {
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
      .sort((a,b) => a.date - b.date)
      .map(o => ({ date: o.date, close: o.close }));
  };

  // 7. Create the Chart instance
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'GLD Close (USD)',
        data: [],
        borderColor: '#b8860b',
        backgroundColor: 'rgba(184,134,11,0.2)',
        pointRadius: 2,
        borderWidth: 1.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,   // crucial
      scales: {
        x: { type: 'time', time: { unit: 'month' } },
        y: { beginAtZero: false }
      },
      plugins: {
        legend: { display: true }
      }
    }
  });

  // 8. Render function
  const render = () => {
    // re‑size canvas in case container moved
    resizeCanvas();
    // filter by date
    const start = new Date(startInput.value);
    const end   = new Date(endInput.value);
    const slice = parsed.filter(r => r.date >= start && r.date <= end);
    const out   = aggregate(slice, freqSelect.value);

    // update chart data
    chart.data.labels = out.map(o => o.date);
    chart.data.datasets[0].data = out.map(o => o.close);

    // redraw
    chart.update();
  };

  // 9. Hook up button
  updateButton.addEventListener('click', render);

  // 10. Initial draw
  render();

  // 11. Optional: redraw if window resizes
  window.addEventListener('resize', () => {
    render();
  });
});
