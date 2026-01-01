/**
 * Testimonials Module
 * Manages user testimonials on main page and profile
 */

/**
 * Load and display testimonials
 */
async function loadTestimonials(containerId = 'testimonials-container', options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
        userId = null,
        featured = false,
        limit = 10,
        skip = 0
    } = options;

    try {
        let url = `/.netlify/functions/testimonials?limit=${limit}&skip=${skip}`;
        if (userId) url += `&userId=${userId}`;
        if (featured) url += `&featured=true`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            displayTestimonials(data.testimonials, containerId);
            return data;
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Failed to load testimonials:', error);
        container.innerHTML = `
            <div class="testimonials-error">
                <i class="fa-solid fa-exclamation-circle"></i>
                <p>Failed to load testimonials</p>
            </div>
        `;
        return null;
    }
}

/**
 * Display testimonials in container
 */
function displayTestimonials(testimonials, containerId = 'testimonials-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!testimonials || testimonials.length === 0) {
        container.innerHTML = `
            <div class="testimonials-empty">
                <i class="fa-solid fa-comment-dots"></i>
                <p>No testimonials yet. Be the first to share your experience!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = testimonials.map(t => createTestimonialCard(t)).join('');
}

/**
 * Create testimonial card HTML
 */
function createTestimonialCard(testimonial) {
    // Get current user ID properly
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || 'anonymous';
    const userName = testimonial.userName || testimonial.name || 'Traveler';
    const destination = testimonial.destination || 'Unknown destination';
    const rating = Number(testimonial.rating) || 5;
    const isOwner = testimonial.userId === userId;
    const stars = '⭐'.repeat(Math.max(1, Math.min(5, rating)));
    const avatar = testimonial.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff&size=80`;
    const liked = testimonial.likedBy && testimonial.likedBy.includes(userId);
    
    const tripDateText = testimonial.tripDate 
        ? new Date(testimonial.tripDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        : '';

    return `
        <div class="testimonial-card ${testimonial.featured ? 'featured' : ''}" data-id="${testimonial._id}">
            ${testimonial.featured ? '<div class="featured-badge">⭐ Featured</div>' : ''}
            ${!testimonial.approved ? '<div class="pending-badge">⏳ Pending Approval</div>' : ''}
            
            <div class="testimonial-header">
                <img src="${avatar}" alt="${userName}" class="testimonial-avatar">
                <div class="testimonial-user-info">
                    <h4 class="testimonial-user-name">${userName}</h4>
                    <div class="testimonial-meta">
                        <span class="testimonial-destination">
                            <i class="fa-solid fa-location-dot"></i> ${destination}
                        </span>
                        ${tripDateText ? `<span class="testimonial-date">${tripDateText}</span>` : ''}
                    </div>
                </div>
            </div>

            <div class="testimonial-rating">${stars}</div>
            
            ${testimonial.title ? `<h3 class="testimonial-title">${testimonial.title}</h3>` : ''}
            
            <p class="testimonial-content">${testimonial.content}</p>

            <div class="testimonial-footer">
                <button class="testimonial-like-btn ${liked ? 'liked' : ''}" 
                        onclick="toggleLikeTestimonial('${testimonial._id}')"
                        ${!testimonial.approved ? 'disabled' : ''}>
                    <i class="fa-solid fa-heart"></i>
                    <span class="like-count">${testimonial.likes || 0}</span>
                </button>
                
                <span class="testimonial-time">${formatTimeAgo(testimonial.createdAt)}</span>
                
                ${isOwner ? `
                    <div class="testimonial-actions">
                        <button class="testimonial-edit-btn" onclick="editTestimonial('${testimonial._id}')">
                            <i class="fa-solid fa-edit"></i> Edit
                        </button>
                        <button class="testimonial-delete-btn" onclick="deleteTestimonial('${testimonial._id}')">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Show add testimonial modal
 */
function showAddTestimonialModal() {
    // Get user from proper localStorage structure
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id;
    
    if (!userId || userId === 'anonymous') {
        if (window.showToast) {
            showToast('Please log in to share your testimonial', 'error');
        } else {
            alert('Please log in to share your testimonial');
        }
        return;
    }

    const userName = user.name || 'Traveler';
    const userEmail = user.email || '';

    const modal = createModal('add-testimonial-modal', 'Share Your Experience', `
        <form id="add-testimonial-form" class="testimonial-form">
            <div class="form-group">
                <label for="testimonial-destination">Destination *</label>
                <input type="text" id="testimonial-destination" required 
                       placeholder="e.g., Hunza Valley, Murree">
            </div>

            <div class="form-group">
                <label for="testimonial-trip-date">Trip Date</label>
                <input type="month" id="testimonial-trip-date">
            </div>

            <div class="form-group">
                <label>Rating *</label>
                <div class="rating-input" id="rating-input">
                    ${[1, 2, 3, 4, 5].map(i => `
                        <span class="rating-star" data-rating="${i}" onclick="selectRating(${i})">⭐</span>
                    `).join('')}
                </div>
                <input type="hidden" id="testimonial-rating" required>
            </div>

            <div class="form-group">
                <label for="testimonial-title">Title (Optional)</label>
                <input type="text" id="testimonial-title" 
                       placeholder="e.g., Amazing Mountain Adventure">
            </div>

            <div class="form-group">
                <label for="testimonial-content">Your Experience * (min 20 characters)</label>
                <textarea id="testimonial-content" rows="5" required 
                          placeholder="Share your travel story..."></textarea>
                <small class="char-count">0 / 20 minimum</small>
            </div>

            <div class="form-actions">
                <button type="button" class="btn-cancel" onclick="closeModal('add-testimonial-modal')">
                    Cancel
                </button>
                <button type="submit" class="btn-submit">
                    <i class="fa-solid fa-paper-plane"></i> Submit
                </button>
            </div>
        </form>
    `);

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);

    // Character counter
    const contentInput = document.getElementById('testimonial-content');
    const charCount = document.querySelector('.char-count');
    contentInput.addEventListener('input', () => {
        const length = contentInput.value.length;
        charCount.textContent = `${length} / 20 minimum`;
        charCount.style.color = length >= 20 ? '#4ade80' : '#fca5a5';
    });

    // Form submission
    document.getElementById('add-testimonial-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitTestimonial();
    });
}

/**
 * Select rating
 */
function selectRating(rating) {
    document.getElementById('testimonial-rating').value = rating;
    document.querySelectorAll('.rating-star').forEach((star, index) => {
        if (index < rating) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });
}

/**
 * Submit testimonial
 */
async function submitTestimonial() {
    // Get user from proper localStorage structure
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id;
    const userName = user.name || 'Traveler';
    const userEmail = user.email || '';

    const destination = document.getElementById('testimonial-destination').value.trim();
    const tripDate = document.getElementById('testimonial-trip-date').value;
    const rating = document.getElementById('testimonial-rating').value;
    const title = document.getElementById('testimonial-title').value.trim();
    const content = document.getElementById('testimonial-content').value.trim();

    if (!destination || !rating || !content) {
        if (window.showToast) {
            showToast('Please fill all required fields', 'error');
        }
        return;
    }

    if (content.length < 20) {
        if (window.showToast) {
            showToast('Content must be at least 20 characters', 'error');
        }
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/testimonials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                userName,
                userEmail,
                destination,
                tripDate: tripDate || null,
                rating: parseInt(rating),
                title: title || null,
                content
            })
        });

        const data = await response.json();

        if (data.success) {
            closeModal('add-testimonial-modal');
            if (window.showToast) {
                showToast('Testimonial submitted! Pending approval.', 'success');
            }
            // Reload testimonials
            setTimeout(() => loadTestimonials(), 500);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Submit testimonial error:', error);
        if (window.showToast) {
            showToast('Failed to submit testimonial', 'error');
        }
    }
}

/**
 * Edit testimonial
 */
async function editTestimonial(testimonialId) {
    try {
        // Fetch testimonial data
        const response = await fetch(`/.netlify/functions/testimonials?testimonialId=${testimonialId}`);
        const data = await response.json();

        if (!data.success) throw new Error(data.error);

        const t = data.testimonial;

        const modal = createModal('edit-testimonial-modal', 'Edit Your Testimonial', `
            <form id="edit-testimonial-form" class="testimonial-form">
                <input type="hidden" id="edit-testimonial-id" value="${testimonialId}">
                
                <div class="form-group">
                    <label for="edit-testimonial-destination">Destination *</label>
                    <input type="text" id="edit-testimonial-destination" required 
                           value="${t.destination}">
                </div>

                <div class="form-group">
                    <label for="edit-testimonial-trip-date">Trip Date</label>
                    <input type="month" id="edit-testimonial-trip-date" 
                           value="${t.tripDate ? t.tripDate.substring(0, 7) : ''}">
                </div>

                <div class="form-group">
                    <label>Rating *</label>
                    <div class="rating-input" id="edit-rating-input">
                        ${[1, 2, 3, 4, 5].map(i => `
                            <span class="rating-star ${i <= t.rating ? 'selected' : ''}" 
                                  data-rating="${i}" onclick="selectEditRating(${i})">⭐</span>
                        `).join('')}
                    </div>
                    <input type="hidden" id="edit-testimonial-rating" value="${t.rating}" required>
                </div>

                <div class="form-group">
                    <label for="edit-testimonial-title">Title (Optional)</label>
                    <input type="text" id="edit-testimonial-title" 
                           value="${t.title || ''}">
                </div>

                <div class="form-group">
                    <label for="edit-testimonial-content">Your Experience *</label>
                    <textarea id="edit-testimonial-content" rows="5" required>${t.content}</textarea>
                    <small class="char-count">${t.content.length} / 20 minimum</small>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick="closeModal('edit-testimonial-modal')">
                        Cancel
                    </button>
                    <button type="submit" class="btn-submit">
                        <i class="fa-solid fa-save"></i> Update
                    </button>
                </div>
            </form>
        `);

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        // Character counter
        const contentInput = document.getElementById('edit-testimonial-content');
        const charCount = document.querySelector('.char-count');
        contentInput.addEventListener('input', () => {
            const length = contentInput.value.length;
            charCount.textContent = `${length} / 20 minimum`;
            charCount.style.color = length >= 20 ? '#4ade80' : '#fca5a5';
        });

        // Form submission
        document.getElementById('edit-testimonial-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateTestimonial();
        });

    } catch (error) {
        console.error('Edit testimonial error:', error);
        if (window.showToast) {
            showToast('Failed to load testimonial', 'error');
        }
    }
}

function selectEditRating(rating) {
    document.getElementById('edit-testimonial-rating').value = rating;
    document.querySelectorAll('#edit-rating-input .rating-star').forEach((star, index) => {
        if (index < rating) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });
}

/**
 * Update testimonial
 */
async function updateTestimonial() {
    // Get user from proper localStorage structure
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id;
    const testimonialId = document.getElementById('edit-testimonial-id').value;
    const destination = document.getElementById('edit-testimonial-destination').value.trim();
    const tripDate = document.getElementById('edit-testimonial-trip-date').value;
    const rating = document.getElementById('edit-testimonial-rating').value;
    const title = document.getElementById('edit-testimonial-title').value.trim();
    const content = document.getElementById('edit-testimonial-content').value.trim();

    if (content.length < 20) {
        if (window.showToast) {
            showToast('Content must be at least 20 characters', 'error');
        }
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/testimonials', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                testimonialId,
                userId,
                destination,
                tripDate: tripDate || null,
                rating: parseInt(rating),
                title: title || null,
                content
            })
        });

        const data = await response.json();

        if (data.success) {
            closeModal('edit-testimonial-modal');
            if (window.showToast) {
                showToast('Testimonial updated! Re-submitted for approval.', 'success');
            }
            setTimeout(() => loadTestimonials(), 500);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Update testimonial error:', error);
        if (window.showToast) {
            showToast('Failed to update testimonial', 'error');
        }
    }
}

/**
 * Delete testimonial
 */
async function deleteTestimonial(testimonialId) {
    if (!confirm('Are you sure you want to delete this testimonial?')) {
        return;
    }

    // Get user from proper localStorage structure
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id;

    try {
        const response = await fetch(`/.netlify/functions/testimonials?testimonialId=${testimonialId}&userId=${userId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            if (window.showToast) {
                showToast('Testimonial deleted successfully', 'success');
            }
            // Remove from DOM
            const card = document.querySelector(`[data-id="${testimonialId}"]`);
            if (card) {
                card.style.animation = 'fadeOut 0.3s';
                setTimeout(() => card.remove(), 300);
            }
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Delete testimonial error:', error);
        if (window.showToast) {
            showToast('Failed to delete testimonial', 'error');
        }
    }
}

/**
 * Toggle like on testimonial
 */
async function toggleLikeTestimonial(testimonialId) {
    // Get user from proper localStorage structure
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id;
    
    if (!userId || userId === 'anonymous') {
        if (window.showToast) {
            showToast('Please log in to like testimonials', 'error');
        }
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/likeTestimonial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testimonialId, userId })
        });

        const data = await response.json();

        if (data.success) {
            // Update UI
            const card = document.querySelector(`[data-id="${testimonialId}"]`);
            if (card) {
                const likeBtn = card.querySelector('.testimonial-like-btn');
                const likeCount = card.querySelector('.like-count');
                
                if (data.liked) {
                    likeBtn.classList.add('liked');
                } else {
                    likeBtn.classList.remove('liked');
                }
                
                likeCount.textContent = data.likes;
            }
        }
    } catch (error) {
        console.error('Like testimonial error:', error);
    }
}

/**
 * Create modal
 */
function createModal(id, title, content) {
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'testimonial-modal';
    modal.innerHTML = `
        <div class="testimonial-modal-backdrop" onclick="closeModal('${id}')"></div>
        <div class="testimonial-modal-content">
            <div class="testimonial-modal-header">
                <h2>${title}</h2>
                <button class="modal-close-btn" onclick="closeModal('${id}')">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            <div class="testimonial-modal-body">
                ${content}
            </div>
        </div>
    `;
    return modal;
}

/**
 * Close modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Format time ago
 */
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
    return new Date(date).toLocaleDateString();
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    // Remove any existing toasts
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Export functions
window.loadTestimonials = loadTestimonials;
window.showAddTestimonialModal = showAddTestimonialModal;
window.editTestimonial = editTestimonial;
window.deleteTestimonial = deleteTestimonial;
window.toggleLikeTestimonial = toggleLikeTestimonial;
window.selectRating = selectRating;
window.selectEditRating = selectEditRating;
window.closeModal = closeModal;
window.showToast = showToast;
