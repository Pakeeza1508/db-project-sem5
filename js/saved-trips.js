// Saved Trips Management Module
// Handles saving, loading, and managing user's saved trips

const SavedTrips = {
  currentUser: null,

  init() {
    this.currentUser = this.getCurrentUser();
  },

  getCurrentUser() {
    // Get from localStorage or your auth system
    const userStr = localStorage.getItem('wanderlyUser');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  // Save a trip to database
  async saveTrip(tripData) {
    if (!this.currentUser) {
      this.showMessage('Please login to save trips', 'error');
      return false;
    }

    try {
      const response = await fetch('/.netlify/functions/savedTrips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.currentUser.email || this.currentUser.id,
          userName: this.currentUser.name || 'Anonymous',
          userEmail: this.currentUser.email || '',
          ...tripData
        })
      });

      const data = await response.json();

      if (data.success) {
        this.showMessage('Trip saved successfully! ✓', 'success');
        return data.trip;
      } else {
        this.showMessage(data.message || 'Failed to save trip', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error saving trip:', error);
      this.showMessage('Error saving trip', 'error');
      return false;
    }
  },

  // Load all saved trips for current user
  async loadSavedTrips() {
    if (!this.currentUser) {
      return { trips: [], stats: { total: 0, shared: 0 } };
    }

    try {
      const userId = this.currentUser.email || this.currentUser.id;
      const response = await fetch(`/.netlify/functions/savedTrips?userId=${encodeURIComponent(userId)}`);
      
      const data = await response.json();

      if (data.success) {
        return {
          trips: data.trips || [],
          stats: data.stats || { total: 0, shared: 0 }
        };
      } else {
        console.error('Failed to load trips:', data.message);
        return { trips: [], stats: { total: 0, shared: 0 } };
      }
    } catch (error) {
      console.error('Error loading trips:', error);
      return { trips: [], stats: { total: 0, shared: 0 } };
    }
  },

  // Load single trip by ID
  async loadTrip(tripId) {
    if (!this.currentUser) {
      return null;
    }

    try {
      const userId = this.currentUser.email || this.currentUser.id;
      const response = await fetch(`/.netlify/functions/savedTrips?tripId=${tripId}&userId=${encodeURIComponent(userId)}`);
      
      const data = await response.json();

      if (data.success) {
        return data.trip;
      } else {
        console.error('Failed to load trip:', data.message);
        return null;
      }
    } catch (error) {
      console.error('Error loading trip:', error);
      return null;
    }
  },

  // Load shared trip by token (public access)
  async loadSharedTrip(shareToken) {
    try {
      const response = await fetch(`/.netlify/functions/savedTrips?shareToken=${shareToken}`);
      
      const data = await response.json();

      if (data.success) {
        return data.trip;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error loading shared trip:', error);
      return null;
    }
  },

  // Toggle trip sharing
  async toggleSharing(tripId, isShared) {
    if (!this.currentUser) {
      this.showMessage('Please login to share trips', 'error');
      return false;
    }

    try {
      const userId = this.currentUser.email || this.currentUser.id;
      const response = await fetch('/.netlify/functions/savedTrips', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tripId,
          userId,
          updates: { isShared }
        })
      });

      const data = await response.json();

      if (data.success) {
        const message = isShared 
          ? 'Trip sharing enabled! Link copied to clipboard.' 
          : 'Trip sharing disabled';
        this.showMessage(message, 'success');
        
        // Copy share link if enabling
        if (isShared && data.trip.shareToken) {
          const shareUrl = `${window.location.origin}/shared-trip.html?token=${data.trip.shareToken}`;
          this.copyToClipboard(shareUrl);
        }
        
        return data.trip;
      } else {
        this.showMessage(data.message || 'Failed to update sharing', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error toggling sharing:', error);
      this.showMessage('Error updating sharing', 'error');
      return false;
    }
  },

  // Delete saved trip
  async deleteTrip(tripId) {
    if (!this.currentUser) {
      this.showMessage('Please login to delete trips', 'error');
      return false;
    }

    if (!confirm('Are you sure you want to delete this trip? This cannot be undone.')) {
      return false;
    }

    try {
      const userId = this.currentUser.email || this.currentUser.id;
      const response = await fetch(`/.netlify/functions/savedTrips?tripId=${tripId}&userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        this.showMessage('Trip deleted successfully', 'success');
        return true;
      } else {
        this.showMessage(data.message || 'Failed to delete trip', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      this.showMessage('Error deleting trip', 'error');
      return false;
    }
  },

  // Display saved trips in a container
  displaySavedTrips(containerId, trips) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!trips || trips.length === 0) {
      container.innerHTML = `
        <div class="no-trips">
          <p>📭 No saved trips yet</p>
          <p class="subtitle">Start planning your next adventure!</p>
          <a href="planner.html" class="btn btn-primary">Plan a Trip</a>
        </div>
      `;
      return;
    }

    const tripsHTML = trips.map(trip => this.createTripCard(trip)).join('');
    container.innerHTML = `<div class="saved-trips-grid">${tripsHTML}</div>`;

    // Attach event listeners
    this.attachTripCardListeners();
  },

  // Create trip card HTML
  createTripCard(trip) {
    const savedDate = new Date(trip.savedAt);
    const formattedDate = savedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const shareIcon = trip.isShared ? '🔗' : '🔒';
    const shareClass = trip.isShared ? 'shared' : 'private';

    return `
      <div class="trip-card" data-trip-id="${trip._id}">
        <div class="trip-header">
          <h3>${trip.destination}</h3>
          <span class="trip-badge ${shareClass}">${shareIcon} ${trip.isShared ? 'Shared' : 'Private'}</span>
        </div>
        
        <div class="trip-details">
          <div class="trip-meta">
            <span>📅 ${trip.days} days</span>
            <span>✈️ ${trip.travelStyle}</span>
            <span>💰 ${trip.budget}</span>
          </div>
          
          <div class="trip-date">
            <small>Saved on ${formattedDate}</small>
          </div>
        </div>

        <div class="trip-actions">
          <button class="btn-action view-trip" data-trip-id="${trip._id}" title="View Trip">
            👁️ View
          </button>
          <button class="btn-action share-trip" data-trip-id="${trip._id}" data-shared="${trip.isShared}" title="Share Trip">
            ${trip.isShared ? '🔗 Shared' : '🔗 Share'}
          </button>
          <button class="btn-action delete-trip" data-trip-id="${trip._id}" title="Delete Trip">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  },

  // Attach event listeners to trip cards
  attachTripCardListeners() {
    // View trip
    document.querySelectorAll('.view-trip').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tripId = e.target.dataset.tripId;
        await this.viewTrip(tripId);
      });
    });

    // Share trip
    document.querySelectorAll('.share-trip').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tripId = e.target.dataset.tripId;
        const isCurrentlyShared = e.target.dataset.shared === 'true';
        await this.handleShareToggle(tripId, isCurrentlyShared);
      });
    });

    // Delete trip
    document.querySelectorAll('.delete-trip').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tripId = e.target.dataset.tripId;
        const success = await this.deleteTrip(tripId);
        if (success) {
          // Remove card from DOM
          e.target.closest('.trip-card').remove();
          
          // Check if no trips left
          const grid = document.querySelector('.saved-trips-grid');
          if (grid && grid.children.length === 0) {
            grid.closest('.saved-trips-container').innerHTML = `
              <div class="no-trips">
                <p>📭 No saved trips yet</p>
                <p class="subtitle">Start planning your next adventure!</p>
                <a href="planner.html" class="btn btn-primary">Plan a Trip</a>
              </div>
            `;
          }
        }
      });
    });
  },

  // View trip details (show in modal or redirect)
  async viewTrip(tripId) {
    const trip = await this.loadTrip(tripId);
    if (!trip) {
      this.showMessage('Failed to load trip', 'error');
      return;
    }

    // Show in modal
    this.showTripModal(trip);
  },

  // Handle share toggle
  async handleShareToggle(tripId, isCurrentlyShared) {
    const newSharedState = !isCurrentlyShared;
    const updatedTrip = await this.toggleSharing(tripId, newSharedState);
    
    if (updatedTrip) {
      // Update button state
      const btn = document.querySelector(`.share-trip[data-trip-id="${tripId}"]`);
      if (btn) {
        btn.dataset.shared = newSharedState;
        btn.innerHTML = newSharedState ? '🔗 Shared' : '🔗 Share';
      }

      // Update badge
      const card = document.querySelector(`.trip-card[data-trip-id="${tripId}"]`);
      if (card) {
        const badge = card.querySelector('.trip-badge');
        if (badge) {
          badge.className = `trip-badge ${newSharedState ? 'shared' : 'private'}`;
          badge.textContent = `${newSharedState ? '🔗' : '🔒'} ${newSharedState ? 'Shared' : 'Private'}`;
        }
      }
    }
  },

  // Show trip details modal
  showTripModal(trip) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('trip-view-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'trip-view-modal';
      modal.className = 'modal';
      document.body.appendChild(modal);
    }

    const costHTML = trip.costBreakdown ? `
      <div class="cost-section">
        <h4>💰 Cost Breakdown</h4>
        <div class="cost-grid">
          ${trip.costBreakdown.accommodation ? `<div class="cost-item"><span>🏨 Accommodation:</span> <strong>PKR ${trip.costBreakdown.accommodation.toLocaleString()}</strong></div>` : ''}
          ${trip.costBreakdown.transportation ? `<div class="cost-item"><span>🚗 Transportation:</span> <strong>PKR ${trip.costBreakdown.transportation.toLocaleString()}</strong></div>` : ''}
          ${trip.costBreakdown.food ? `<div class="cost-item"><span>🍽️ Food:</span> <strong>PKR ${trip.costBreakdown.food.toLocaleString()}</strong></div>` : ''}
          ${trip.costBreakdown.activities ? `<div class="cost-item"><span>🎯 Activities:</span> <strong>PKR ${trip.costBreakdown.activities.toLocaleString()}</strong></div>` : ''}
          ${trip.costBreakdown.total ? `<div class="cost-item total"><span>Total:</span> <strong>PKR ${trip.costBreakdown.total.toLocaleString()}</strong></div>` : ''}
        </div>
      </div>
    ` : '';

    const weatherHTML = trip.weatherInfo ? `
      <div class="weather-section">
        <h4>🌤️ Weather</h4>
        <p><strong>Temperature:</strong> ${trip.weatherInfo.temperature}°C</p>
        <p><strong>Conditions:</strong> ${trip.weatherInfo.description}</p>
      </div>
    ` : '';

    modal.innerHTML = `
      <div class="modal-content large">
        <span class="close">&times;</span>
        
        <div class="modal-header">
          <h2>${trip.destination}</h2>
          <div class="trip-meta-modal">
            <span>📅 ${trip.days} days</span>
            <span>✈️ ${trip.travelStyle}</span>
            <span>💰 ${trip.budget}</span>
          </div>
        </div>

        <div class="modal-body">
          ${weatherHTML}
          ${costHTML}
          
          <div class="itinerary-section">
            <h4>📝 Itinerary</h4>
            <div class="trip-plan-content">
              ${this.formatTripPlan(trip.tripPlan)}
            </div>
          </div>

          ${trip.preferences ? `
            <div class="preferences-section">
              <h4>✨ Preferences</h4>
              <p>${trip.preferences}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    modal.style.display = 'block';

    // Close button
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => {
      modal.style.display = 'none';
    };

    // Click outside to close
    window.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    };
  },

  // Format trip plan text
  formatTripPlan(planText) {
    if (!planText) return '<p>No itinerary available</p>';
    
    // Convert line breaks to paragraphs
    const lines = planText.split('\n').filter(line => line.trim());
    return lines.map(line => {
      line = line.trim();
      // Bold headers
      if (line.startsWith('Day ') || line.startsWith('###')) {
        return `<h5>${line.replace(/###/g, '')}</h5>`;
      }
      return `<p>${line}</p>`;
    }).join('');
  },

  // Copy to clipboard
  copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(err => {
        console.error('Failed to copy:', err);
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  },

  // Fallback copy method
  fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    document.body.removeChild(textarea);
  },

  // Show message
  showMessage(message, type = 'info') {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-toast ${type}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    // Trigger animation
    setTimeout(() => messageDiv.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      messageDiv.classList.remove('show');
      setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SavedTrips.init());
} else {
  SavedTrips.init();
}
