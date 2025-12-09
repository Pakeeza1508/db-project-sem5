let shareId = null;
let shareMeta = null;
let requiresPassword = false;

window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    shareId = params.get('id');
    if (!shareId) {
        document.getElementById('trip-meta').textContent = 'No share id provided.';
        return;
    }
    loadSharedTrip();
    loadComments();

    // Add toast animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
});

async function loadSharedTrip() {
    try {
        let url = `/.netlify/functions/getSharedTrip?id=${shareId}`;
        const password = sessionStorage.getItem(`share_${shareId}_password`);
        if (password) {
            url += `&password=${encodeURIComponent(password)}`;
        }

        const res = await fetch(url);
        if (res.status === 403) {
            requiresPassword = true;
            promptSharePassword();
            return;
        }
        if (!res.ok) throw new Error('Failed to load shared trip');

        const data = await res.json();
        shareMeta = data.share;
        const trip = data.trip;

        // Show expiry date
        const expiresAt = new Date(data.share.expiresAt);
        const daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
        const expireText = daysLeft > 0 ? `Expires in ${daysLeft} day(s)` : 'Link expired';

        document.getElementById('trip-meta').innerHTML = `${trip.destination} • ${trip.travelDays || '?'} days • ${trip.budget || 'Budget n/a'} • ${trip.travelStyle || 'Style n/a'} • <span style="color: var(--text-muted);"><i class="fa-solid fa-clock"></i> ${expireText}</span>`;
        renderList('itinerary-list', trip.itinerary || [], item => `${item.day ? 'Day ' + item.day + ': ' : ''}${item.description || ''}`);
        renderList('hotels-list', trip.hotels || [], h => `${h.name || 'Hotel'} (${h.nights || '?'} nights) - ${h.price || ''}`);
    } catch (err) {
        console.error(err);
        document.getElementById('trip-meta').textContent = 'Could not load shared trip.';
    }
}

function promptSharePassword() {
    const pwd = prompt('This trip is password-protected. Enter password:');
    if (!pwd) return;
    sessionStorage.setItem(`share_${shareId}_password`, pwd);
    loadSharedTrip();
}

function renderList(id, arr, mapFn) {
    const container = document.getElementById(id);
    if (!arr.length) {
        container.innerHTML = '<div class="muted">Nothing here yet.</div>';
        return;
    }
    container.innerHTML = arr.map(item => `<div class="pill">${mapFn(item)}</div>`).join('');
}

async function loadComments() {
    try {
        const res = await fetch(`/.netlify/functions/getComments?shareId=${shareId}`);
        if (!res.ok) throw new Error('Comments failed');
        const data = await res.json();
        const list = data.comments || [];
        const container = document.getElementById('comments');
        if (!list.length) {
            container.innerHTML = '<div class="muted">No comments yet.</div>';
            return;
        }
        container.innerHTML = list.map(c => {
            const date = c.createdAt ? new Date(c.createdAt).toLocaleString() : '';
            return `<div class="comment"><div style="color:var(--text);font-weight:600;">${c.name || 'Guest'}</div><div class="muted">${date}</div><div>${c.message}</div></div>`;
        }).join('');
    } catch (err) {
        console.error(err);
        document.getElementById('comments').innerHTML = '<div class="muted">Failed to load comments.</div>';
    }
}

async function postComment() {
    const name = document.getElementById('comment-name').value.trim() || 'Anonymous';
    const message = document.getElementById('comment-message').value.trim();
    if (!message) {
        alert('Please enter a message.');
        return;
    }
    try {
        const res = await fetch('/.netlify/functions/addComment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shareId, name, message })
        });
        if (!res.ok) throw new Error('Comment failed');
        document.getElementById('comment-message').value = '';
        await loadComments();
    } catch (err) {
        console.error(err);
        alert('Could not post comment.');
    }
}
