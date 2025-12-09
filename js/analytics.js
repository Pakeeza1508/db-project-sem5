let statsCache = null;

window.addEventListener('DOMContentLoaded', () => {
    loadStats();
});

async function loadStats() {
    try {
        const res = await fetch('/.netlify/functions/getTripStats');
        if (!res.ok) throw new Error('Failed to load stats');
        const data = await res.json();
        const stats = data.stats || {};
        statsCache = stats;
        renderOverview(stats.overview || {});
        renderTopDestinations(stats.topDestinations || []);
        renderBars('budget-bars', stats.budgetBreakdown || [], 'budget', 'avgCost');
        renderBars('style-bars', stats.styleBreakdown || [], 'style', 'count');
        renderBars('duration-bars', stats.durationBreakdown || [], 'range', 'count');
        renderTimeline(stats.monthlyTimeline || []);
        renderRecent(stats.recentTrips || []);
    } catch (err) {
        console.error(err);
    }
}

// Export helpers
function exportStatsJSON() {
    if (!statsCache) return alert('Stats not loaded yet.');
    const blob = new Blob([JSON.stringify(statsCache, null, 2)], { type: 'application/json' });
    downloadFile('wanderly-stats.json', blob);
}

function exportStatsCSV() {
    if (!statsCache) return alert('Stats not loaded yet.');
    const lines = [];

    // Overview
    lines.push('Overview');
    lines.push('metric,value');
    const o = statsCache.overview || {};
    lines.push(`totalTrips,${o.totalTrips ?? 0}`);
    lines.push(`uniqueDestinations,${o.uniqueDestinations ?? 0}`);
    lines.push(`totalDays,${o.totalDays ?? 0}`);
    lines.push(`avgDays,${o.avgDays ?? 0}`);
    lines.push('');

    // Top destinations
    lines.push('Top Destinations');
    lines.push('destination,count,lastVisited');
    (statsCache.topDestinations || []).forEach(item => {
        lines.push(`${csv(item.destination)},${item.count ?? 0},${item.last ?? ''}`);
    });
    lines.push('');

    // Budget breakdown
    lines.push('Budget Breakdown');
    lines.push('budget,count,avgCost');
    (statsCache.budgetBreakdown || []).forEach(item => {
        lines.push(`${csv(item.budget)},${item.count ?? 0},${item.avgCost ?? 0}`);
    });
    lines.push('');

    // Style breakdown
    lines.push('Style Breakdown');
    lines.push('style,count');
    (statsCache.styleBreakdown || []).forEach(item => {
        lines.push(`${csv(item.style)},${item.count ?? 0}`);
    });
    lines.push('');

    // Duration breakdown
    lines.push('Duration Breakdown');
    lines.push('range,count');
    (statsCache.durationBreakdown || []).forEach(item => {
        lines.push(`${csv(item.range)},${item.count ?? 0}`);
    });
    lines.push('');

    // Monthly timeline
    lines.push('Monthly Timeline');
    lines.push('month,count');
    (statsCache.monthlyTimeline || []).forEach(item => {
        lines.push(`${csv(item.month)},${item.count ?? 0}`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    downloadFile('wanderly-stats.csv', blob);
}

function exportStatsPDF() {
    window.print();
}

function csv(value) {
    const str = value === undefined || value === null ? '' : String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function downloadFile(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function renderOverview(overview) {
    const cards = document.getElementById('overview-cards');
    const items = [
        { label: 'Total Trips', value: overview.totalTrips ?? 0, icon: 'fa-suitcase' },
        { label: 'Destinations', value: overview.uniqueDestinations ?? 0, icon: 'fa-earth-americas' },
        { label: 'Total Days', value: overview.totalDays ?? 0, icon: 'fa-clock' },
        { label: 'Avg Trip Length', value: overview.avgDays ?? '-', icon: 'fa-ruler-horizontal' }
    ];
    cards.innerHTML = items.map(item => `
        <div class="card">
            <h3><i class="fa-solid ${item.icon}"></i> ${item.label}</h3>
            <div class="value">${item.value}</div>
        </div>
    `).join('');
}

function renderTopDestinations(list) {
    const container = document.getElementById('top-destinations');
    if (!list.length) {
        container.innerHTML = '<div class="muted">No destinations yet.</div>';
        return;
    }
    container.innerHTML = list.map(item => {
        const last = item.last ? new Date(item.last).toLocaleDateString() : '—';
        return `
            <div class="list-item">
                <div>
                    <div style="color: var(--text); font-weight: 600;">${item.destination}</div>
                    <div class="muted">${item.count} trip(s)</div>
                </div>
                <span class="badge">Last: ${last}</span>
            </div>
        `;
    }).join('');
}

function renderBars(id, data, labelKey, valueKey) {
    const container = document.getElementById(id);
    if (!data.length) {
        container.innerHTML = '<div class="muted">No data yet.</div>';
        return;
    }
    const max = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1);
    container.innerHTML = data.map(d => {
        const value = Number(d[valueKey]) || 0;
        const width = Math.max(6, Math.round((value / max) * 100));
        return `
            <div class="bar-item">
                <div class="bar-label"><span>${d[labelKey] || 'Unknown'}</span><span>${value}</span></div>
                <div class="bar"><span style="width:${width}%;"></span></div>
            </div>
        `;
    }).join('');
}

function renderTimeline(rows) {
    const container = document.getElementById('timeline-cards');
    if (!rows.length) {
        container.innerHTML = '<div class="muted">No timeline data.</div>';
        return;
    }
    container.innerHTML = rows.map(r => `
        <div class="timeline-card">
            <div style="color: var(--text); font-weight: 600;">${r.month}</div>
            <div class="muted">${r.count} trip(s)</div>
        </div>
    `).join('');
}

function renderRecent(trips) {
    const container = document.getElementById('recent-trips');
    if (!trips.length) {
        container.innerHTML = '<div class="muted">No recent trips.</div>';
        return;
    }
    container.innerHTML = trips.map(trip => {
        const date = trip.createdAt ? new Date(trip.createdAt).toLocaleDateString() : '';
        return `
            <div class="list-item">
                <div>
                    <div style="color: var(--text); font-weight: 600;">${trip.destination}</div>
                    <div class="muted">${trip.travelDays} days • ${trip.budget || 'Budget n/a'} • ${trip.travelStyle || 'Style n/a'}</div>
                </div>
                <span class="badge">${date}</span>
            </div>
        `;
    }).join('');
}
