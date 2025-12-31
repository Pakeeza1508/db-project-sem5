let allTrips = [];
let filteredTrips = [];
let selectedIds = new Set();
let lastComparison = [];
const params = new URLSearchParams(window.location.search);
const presetIds = params.get('ids');

const tripListEl = document.getElementById('trip-list');
const searchInput = document.getElementById('search-input');
const compareBtn = document.getElementById('compare-btn');
const clearBtn = document.getElementById('clear-btn');
const compareGrid = document.getElementById('compare-grid');
const compareSection = document.getElementById('compare-section');
const summaryEl = document.getElementById('comparison-summary');
const exportCsvBtn = document.getElementById('export-csv');
const exportPdfBtn = document.getElementById('export-pdf');

searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase();
  filteredTrips = allTrips.filter(t => (t.destination || '').toLowerCase().includes(q));
  renderList();
});

clearBtn.addEventListener('click', () => {
  selectedIds.clear();
  compareBtn.disabled = true;
  compareSection.style.display = 'none';
  summaryEl.style.display = 'none';
  renderList();
});

exportCsvBtn.addEventListener('click', () => {
  if (!lastComparison.length) {
    alert('Run a comparison first.');
    return;
  }
  exportCSV(lastComparison);
});

exportPdfBtn.addEventListener('click', () => {
  if (!lastComparison.length) {
    alert('Run a comparison first.');
    return;
  }
  window.print();
});

compareBtn.addEventListener('click', async () => {
  if (selectedIds.size < 2) {
    alert('Select at least 2 trips to compare');
    return;
  }
  
  // Show loading state
  const originalText = compareBtn.innerHTML;
  compareBtn.disabled = true;
  compareBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
  
  try {
    await loadComparison();
  } catch (err) {
    console.error('Comparison error:', err);
    alert('Failed to load comparison. Please try again.');
  } finally {
    // Restore button state
    compareBtn.innerHTML = originalText;
    compareBtn.disabled = selectedIds.size < 2;
  }
});

init();

async function init() {
  try {
    const res = await fetch('/.netlify/functions/getTrips?limit=200');
    const data = await res.json();
    allTrips = data.trips || [];
    filteredTrips = allTrips;
    if (presetIds) {
      presetIds.split(',').filter(Boolean).forEach(id => selectedIds.add(id));
    }
    renderList();
    if (selectedIds.size >= 2) {
      compareBtn.disabled = false;
      await loadComparison();
    }
  } catch (e) {
    console.error('Failed to load trips', e);
    tripListEl.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; color: var(--text);">
        <h3 style="margin: 0 0 8px; color: var(--text);">
          <i class="fa-solid fa-info-circle" style="color: #f59e0b; margin-right: 8px;"></i>
          No Trips Found
        </h3>
        <p style="color: var(--text-muted); margin: 0 0 12px; font-size: 0.95rem;">
          You haven't saved any trips yet. Create your first trip using the AI Trip Planner to start comparing!
        </p>
        <a href="planner.html" style="
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--primary);
          color: white;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s;
        " onmouseover="this.style.background='var(--secondary)'" onmouseout="this.style.background='var(--primary)'">
          <i class="fa-solid fa-wand-magic-sparkles"></i> Create Your First Trip
        </a>
      </div>
    `;
  }
}

function renderList() {
  tripListEl.innerHTML = '';
  if (!filteredTrips.length) {
    tripListEl.innerHTML = '<div class="card" style="grid-column: 1 / -1; color: var(--text);">No trips found.</div>';
    return;
  }

  filteredTrips.forEach(trip => {
    const card = document.createElement('div');
    card.className = 'card';

    const checked = selectedIds.has(String(trip._id));
    card.innerHTML = `
      <div class="checkbox-row">
        <input type="checkbox" ${checked ? 'checked' : ''} data-id="${trip._id}" />
        <div>
          <h3><i class="fa-solid fa-location-dot"></i> ${trip.destination || 'Destination'}</h3>
          <div class="muted">${trip.travelDays || '?'} days • ${trip.travelStyle || 'Style'} • ${trip.budget || 'Budget'}</div>
        </div>
      </div>
      <div class="list" style="margin-top:10px;">
        <span class="chip"><i class="fa-regular fa-star"></i> Rating: ${(trip.rating || 0).toFixed ? trip.rating.toFixed(1) : (trip.rating || 0)}</span>
        <span class="chip"><i class="fa-solid fa-heart"></i> Favorite: ${trip.favorite ? 'Yes' : 'No'}</span>
        <span class="chip"><i class="fa-solid fa-coins"></i> Total: ${trip.costs?.total || 'n/a'}</span>
      </div>
    `;

    card.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) {
        if (selectedIds.size >= 3) {
          e.target.checked = false;
          alert('You can compare up to 3 trips');
          return;
        }
        selectedIds.add(String(trip._id));
      } else {
        selectedIds.delete(String(trip._id));
      }
      compareBtn.disabled = selectedIds.size < 2;
    });

    tripListEl.appendChild(card);
  });
}

async function loadComparison() {
  const idsParam = Array.from(selectedIds).join(',');
  const res = await fetch(`/.netlify/functions/getTripsByIds?ids=${idsParam}`);
  
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to load comparison');
  }
  
  if (!data.trips || data.trips.length === 0) {
    throw new Error('No trips returned for comparison');
  }
  
  renderComparison(data.trips);
}

function renderComparison(trips) {
  if (!trips.length) return;
  compareGrid.innerHTML = '';
  compareSection.style.display = 'block';
  lastComparison = trips;

  // Precompute metrics
  const withMetrics = trips.map(t => ({
    ...t,
    costNum: parseCost(t.costs?.total),
    ratingNum: Number(t.rating) || 0,
    daysNum: Number(t.travelDays) || Number(t.travelDaysInt) || 0,
    activities: extractActivities(t.itinerary || [])
  }));

  // Identify best values
  const minCost = Math.min(...withMetrics.map(t => t.costNum || Infinity));
  const maxRating = Math.max(...withMetrics.map(t => t.ratingNum || 0));
  const minDays = Math.min(...withMetrics.map(t => t.daysNum || Infinity));

  withMetrics.forEach(t => {
    const card = document.createElement('div');
    card.className = 'compare-card';
    card.innerHTML = `
      <div class="compare-header">
        <div>
          <h3 class="card-title" style="margin:0;">${t.destination || 'Trip'}</h3>
          <div class="muted">${t.travelStyle || 'Style'} • ${t.budget || 'Budget'}</div>
        </div>
        <span class="badge">${t.travelDays || '?'} days</span>
      </div>
      <div class="stat-row"><span class="label">Total Cost</span><span class="${t.costNum === minCost ? 'highlight-good' : ''}">${t.costs?.total || 'n/a'}</span></div>
      <div class="stat-row"><span class="label">Rating</span><span class="${t.ratingNum === maxRating ? 'highlight-good' : ''}">${t.ratingNum.toFixed(1)}</span></div>
      <div class="stat-row"><span class="label">Favorite</span><span>${t.favorite ? 'Yes' : 'No'}</span></div>
      <div class="stat-row"><span class="label">Style</span><span>${t.travelStyle || 'n/a'}</span></div>
      <div class="stat-row"><span class="label">Budget</span><span>${t.budget || 'n/a'}</span></div>
      <div class="stat-row"><span class="label">Hotels</span><span>${(t.hotels || []).length}</span></div>
      <div class="stat-row"><span class="label">Activities</span><span>${t.activities.length}</span></div>
      <div>
        <h4 class="section-title">Top Activities</h4>
        <div class="list">
          ${t.activities.slice(0,4).map(a => `<span class="badge">${a}</span>`).join('') || '<span class="muted">No activities</span>'}
        </div>
      </div>
    `;
    compareGrid.appendChild(card);
  });

  // Overlap summary
  const overlap = computeOverlap(withMetrics.map(t => t.activities));
  summaryEl.style.display = 'block';
  summaryEl.innerHTML = `
    <div><strong>Cheapest:</strong> ${withMetrics.find(t => t.costNum === minCost)?.destination || 'n/a'}</div>
    <div><strong>Highest Rated:</strong> ${withMetrics.find(t => t.ratingNum === maxRating)?.destination || 'n/a'}</div>
    <div><strong>Shortest Trip:</strong> ${withMetrics.find(t => t.daysNum === minDays)?.destination || 'n/a'}</div>
    <div><strong>Overlap (${overlap.length}):</strong> ${overlap.slice(0,6).join(', ') || 'None'}</div>
  `;
  
  // Scroll to comparison section smoothly
  setTimeout(() => {
    compareSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function parseCost(val) {
  if (!val) return null;
  const num = Number(String(val).replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : null;
}

function extractActivities(itinerary) {
  const acts = [];
  itinerary.forEach(day => {
    (day.activities || []).forEach(act => {
      if (act.activity) acts.push(act.activity);
      else if (act.description) acts.push(act.description);
    });
    if (day.description) acts.push(day.description);
  });
  // Deduplicate & trim
  const seen = new Set();
  const clean = [];
  acts.forEach(a => {
    const trimmed = a.trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) {
      seen.add(trimmed.toLowerCase());
      clean.push(trimmed);
    }
  });
  return clean;
}

function computeOverlap(listOfArrays) {
  if (!listOfArrays.length) return [];
  const counts = new Map();
  listOfArrays.forEach(arr => {
    arr.forEach(item => {
      counts.set(item, (counts.get(item) || 0) + 1);
    });
  });
  const needed = listOfArrays.length;
  return Array.from(counts.entries())
    .filter(([_, c]) => c >= Math.min(2, needed))
    .map(([item]) => item);
}

function exportCSV(trips) {
  if (!trips.length) return;
  
  const rows = [];
  rows.push(['Destination', 'Days', 'Style', 'Budget', 'Total Cost', 'Rating', 'Favorite', 'Hotels', 'Activities']);
  
  trips.forEach(t => {
    const acts = extractActivities(t.itinerary || []);
    rows.push([
      t.destination || 'N/A',
      t.travelDays || 0,
      t.travelStyle || 'N/A',
      t.budget || 'N/A',
      t.costs?.total || 'N/A',
      (Number(t.rating) || 0).toFixed(1),
      t.favorite ? 'Yes' : 'No',
      (t.hotels || []).length,
      acts.slice(0, 5).join('; ')
    ]);
  });
  
  let csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `trip-comparison-${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
