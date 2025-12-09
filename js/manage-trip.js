// Manage trip itinerary: track activities, add notes, mark as done
let currentTrip = null;
let completedActivities = {}; // Map of activityId -> {done, notes}

// Get tripId from query params
const params = new URLSearchParams(window.location.search);
const tripId = params.get('id');

if (!tripId) {
    document.body.innerHTML = '<div style="text-align: center; margin-top: 2rem;"><h2>No trip selected. <a href="my-trips.html">Go back to My Trips</a></h2></div>';
}

// Load trip on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadTrip();
    renderItinerary();
    loadActivityStatus();
    loadTripNotes();
});

// Load trip data from MongoDB
async function loadTrip() {
    try {
        const response = await fetch(`/.netlify/functions/getTripById?id=${tripId}`);
        if (!response.ok) throw new Error('Trip not found');
        const data = await response.json();
        currentTrip = data.trip;
        console.log('✅ Loaded trip:', currentTrip);
        updateTripHeader();
    } catch (error) {
        console.error('❌ Error loading trip:', error);
        showToast('Failed to load trip', 'error');
    }
}

// Update trip header info
function updateTripHeader() {
    if (!currentTrip) return;
    document.getElementById('tripDestination').textContent = currentTrip.destination || 'Unknown';
    document.getElementById('tripDays').textContent = currentTrip.days || '-';
    document.getElementById('tripStyle').textContent = currentTrip.travelStyle || '-';
    document.getElementById('tripBudget').textContent = currentTrip.budget || '-';
    document.getElementById('tripCost').textContent = currentTrip.estimatedCost ? `$${currentTrip.estimatedCost.toLocaleString()}` : '-';
}

// Render day-by-day itinerary
function renderItinerary() {
    if (!currentTrip || !currentTrip.itinerary || currentTrip.itinerary.length === 0) {
        document.getElementById('daysContainer').innerHTML = '<div class="no-activities">No activities planned for this trip.</div>';
        return;
    }

    const container = document.getElementById('daysContainer');
    container.innerHTML = '';

    const startDate = new Date(currentTrip.createdAt || new Date());
    let totalActivities = 0;

    currentTrip.itinerary.forEach((day, dayIndex) => {
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + dayIndex);
        const dateStr = dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

        const daySection = document.createElement('div');
        daySection.className = 'day-section';
        daySection.innerHTML = `
            <div class="day-header">
                <div>
                    <div class="day-title">Day ${dayIndex + 1}</div>
                    <div class="day-date">${dateStr}</div>
                </div>
            </div>
            <div class="activity-list" id="day-${dayIndex}-activities"></div>
        `;

        const activitiesContainer = daySection.querySelector(`#day-${dayIndex}-activities`);

        // Render activities for this day
        if (day.activities && day.activities.length > 0) {
            day.activities.forEach((activity, actIdx) => {
                totalActivities++;
                const activityId = `${dayIndex}-${actIdx}`;
                const status = completedActivities[activityId] || { done: false, notes: '' };

                const activityEl = document.createElement('div');
                activityEl.className = `activity-item ${status.done ? 'completed' : ''}`;
                activityEl.id = `activity-${activityId}`;
                activityEl.innerHTML = `
                    <input type="checkbox" class="activity-checkbox" data-id="${activityId}" ${status.done ? 'checked' : ''}>
                    <div class="activity-content">
                        <div class="activity-name">${activity.name || 'Activity'}</div>
                        <div class="activity-description">${activity.description || 'No description'}</div>
                        ${status.notes ? `<div class="activity-notes show">${escapeHtml(status.notes)}</div>` : '<div class="activity-notes"></div>'}
                        <div class="notes-editor ${status.notes && !document.querySelector(`[data-id="${activityId}"]`)?.checked ? '' : ''}">
                            <textarea class="notes-input" placeholder="Add notes for this activity..."></textarea>
                            <div class="notes-buttons">
                                <button class="btn-save-note">Save Note</button>
                                <button class="btn-cancel-note">Cancel</button>
                            </div>
                        </div>
                    </div>
                `;

                // Checkbox handler
                const checkbox = activityEl.querySelector('.activity-checkbox');
                checkbox.addEventListener('change', (e) => {
                    completedActivities[activityId].done = e.target.checked;
                    activityEl.classList.toggle('completed', e.target.checked);
                    updateProgress();
                });

                // Notes button handlers
                const notesBtn = activityEl.querySelector('.btn-save-note');
                const cancelBtn = activityEl.querySelector('.btn-cancel-note');
                const notesInput = activityEl.querySelector('.notes-input');
                const notesDisplay = activityEl.querySelector('.activity-notes');
                const notesEditor = activityEl.querySelector('.notes-editor');

                // Prefill if notes exist
                if (status.notes) {
                    notesInput.value = status.notes;
                }

                // Show notes editor when clicking on activity description or notes
                [notesDisplay, activityEl.querySelector('.activity-description')].forEach(el => {
                    if (el) {
                        el.addEventListener('click', (e) => {
                            e.stopPropagation();
                            notesEditor.classList.add('show');
                            notesInput.focus();
                        });
                    }
                });

                notesBtn.addEventListener('click', () => {
                    const noteText = notesInput.value.trim();
                    completedActivities[activityId].notes = noteText;
                    notesDisplay.textContent = noteText;
                    notesDisplay.classList.toggle('show', noteText.length > 0);
                    notesEditor.classList.remove('show');
                });

                cancelBtn.addEventListener('click', () => {
                    notesEditor.classList.remove('show');
                    notesInput.value = completedActivities[activityId].notes || '';
                });

                activitiesContainer.appendChild(activityEl);
            });
        } else {
            activitiesContainer.innerHTML = '<div class="no-activities">No activities for this day.</div>';
        }

        container.appendChild(daySection);
    });

    // Set total count
    document.getElementById('totalCount').textContent = totalActivities;
    updateProgress();
}

// Load saved activity status from MongoDB
function loadActivityStatus() {
    if (!currentTrip || !currentTrip.completed) return;

    currentTrip.completed.forEach(item => {
        completedActivities[item.activityId] = {
            done: item.done || false,
            notes: item.notes || ''
        };
    });
    console.log('✅ Loaded activity status:', completedActivities);
}

// Load trip-level notes
function loadTripNotes() {
    if (!currentTrip || !currentTrip.notes) return;
    document.getElementById('tripNotesTextarea').value = currentTrip.notes;
}

// Update progress bar
function updateProgress() {
    const total = document.getElementById('totalCount').textContent;
    const completed = Object.values(completedActivities).filter(a => a.done).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    document.getElementById('completedCount').textContent = completed;
    document.getElementById('progressFill').style.width = percentage + '%';
}

// Save all changes to MongoDB
document.getElementById('saveTripBtn').addEventListener('click', async () => {
    const btn = document.getElementById('saveTripBtn');
    btn.disabled = true;

    try {
        const tripNotes = document.getElementById('tripNotesTextarea').value.trim();

        // Prepare completed activities array
        const completed = Object.entries(completedActivities).map(([activityId, data]) => ({
            activityId,
            done: data.done,
            notes: data.notes
        }));

        // Call updateTrip endpoint
        const response = await fetch('/.netlify/functions/updateTrip', {
            method: 'PATCH',
            body: JSON.stringify({
                tripId,
                completed,
                notes: tripNotes
            })
        });

        if (!response.ok) throw new Error('Failed to update trip');
        const data = await response.json();
        console.log('✅ Trip updated:', data);
        showToast('Trip saved successfully!');
    } catch (error) {
        console.error('❌ Error saving trip:', error);
        showToast('Failed to save trip', 'error');
    } finally {
        btn.disabled = false;
    }
});

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Escape HTML for display
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
