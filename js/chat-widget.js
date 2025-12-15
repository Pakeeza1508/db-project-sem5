// Floating AI Chat Widget
let chatWidgetOpen = false;
let chatMessages = [];

// Initialize chat widget on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        createChatWidget();
    });
}

function createChatWidget() {
    // Don't create on chat.html page itself
    if (window.location.pathname.includes('chat.html')) return;
    
    const widgetHTML = `
        <!-- Chat Widget Container -->
        <div id="chat-widget-container" style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: 'Outfit', sans-serif;
        ">
            <!-- Chat Toggle Button -->
            <button id="chat-toggle-btn" onclick="openChatPage()" style="
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #6366f1, #a855f7);
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            " onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 6px 25px rgba(99, 102, 241, 0.6)'"
               onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 20px rgba(99, 102, 241, 0.4)'"
               title="Chat with Wanderly AI">
                <i class="fa-solid fa-robot"></i>
            </button>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);
}

function openChatPage() {
    // Open the external chat link in a new tab
    window.open('https://mindtrip.ai/chat/3657680', '_blank', 'noopener,noreferrer');
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.openChatPage = openChatPage;
}
