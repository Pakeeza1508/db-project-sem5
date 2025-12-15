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
            <!-- Chat Window -->
            <div id="chat-window" style="
                display: none;
                width: 380px;
                height: 550px;
                background: rgba(20, 20, 40, 0.98);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                overflow: hidden;
                flex-direction: column;
                margin-bottom: 10px;
            ">
                <!-- Chat Header -->
                <div style="
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                ">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-robot" style="color: white; font-size: 1.2rem;"></i>
                        <div>
                            <div style="color: white; font-weight: 600; font-size: 1rem;">Wanderly AI</div>
                            <div style="color: rgba(255, 255, 255, 0.8); font-size: 0.75rem;">Your Travel Assistant</div>
                        </div>
                    </div>
                    <button onclick="toggleChatWidget()" style="
                        background: none;
                        border: none;
                        color: white;
                        cursor: pointer;
                        font-size: 1.2rem;
                        padding: 4px;
                        transition: transform 0.2s;
                    " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <!-- Chat Messages -->
                <div id="chat-messages" style="
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    background: rgba(10, 10, 20, 0.5);
                ">
                    <!-- Initial welcome message -->
                    <div class="chat-message bot-message" style="
                        display: flex;
                        gap: 10px;
                        animation: slideUp 0.3s ease;
                    ">
                        <div style="
                            width: 32px;
                            height: 32px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, #6366f1, #a855f7);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            flex-shrink: 0;
                        ">
                            <i class="fa-solid fa-robot" style="color: white; font-size: 0.9rem;"></i>
                        </div>
                        <div style="
                            background: rgba(255, 255, 255, 0.05);
                            padding: 12px 16px;
                            border-radius: 12px;
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            max-width: 80%;
                            color: var(--text);
                            line-height: 1.5;
                        ">
                            👋 Hi! I'm your Wanderly AI assistant. Ask me anything about travel planning, destinations, or trip recommendations!
                        </div>
                    </div>
                </div>

                <!-- Chat Input -->
                <div style="
                    padding: 16px;
                    background: rgba(20, 20, 40, 0.8);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                ">
                    <form id="chat-widget-form" style="display: flex; gap: 8px;">
                        <input 
                            type="text" 
                            id="chat-widget-input"
                            placeholder="Ask me anything..."
                            autocomplete="off"
                            style="
                                flex: 1;
                                padding: 12px 16px;
                                background: rgba(255, 255, 255, 0.05);
                                border: 1px solid rgba(255, 255, 255, 0.1);
                                border-radius: 10px;
                                color: var(--text);
                                font-family: inherit;
                                outline: none;
                                transition: all 0.3s;
                            "
                            onfocus="this.style.borderColor='var(--primary)'; this.style.background='rgba(255, 255, 255, 0.08)'"
                            onblur="this.style.borderColor='rgba(255, 255, 255, 0.1)'; this.style.background='rgba(255, 255, 255, 0.05)'"
                        >
                        <button type="submit" style="
                            padding: 12px 20px;
                            background: linear-gradient(135deg, #6366f1, #a855f7);
                            border: none;
                            border-radius: 10px;
                            color: white;
                            cursor: pointer;
                            font-weight: 600;
                            transition: all 0.3s;
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(99, 102, 241, 0.4)'"
                           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </form>
                </div>
            </div>

            <!-- Chat Toggle Button -->
            <button id="chat-toggle-btn" onclick="toggleChatWidget()" style="
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
                margin-left: auto;
            " onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 6px 25px rgba(99, 102, 241, 0.6)'"
               onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 20px rgba(99, 102, 241, 0.4)'">
                <i class="fa-solid fa-robot"></i>
            </button>
        </div>

        <style>
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            #chat-messages::-webkit-scrollbar {
                width: 6px;
            }

            #chat-messages::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
            }

            #chat-messages::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 10px;
            }

            #chat-messages::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            @media (max-width: 768px) {
                #chat-window {
                    width: calc(100vw - 40px) !important;
                    height: calc(100vh - 100px) !important;
                }
            }
        </style>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    // Add form submit handler
    document.getElementById('chat-widget-form').addEventListener('submit', handleChatSubmit);
}

function toggleChatWidget() {
    chatWidgetOpen = !chatWidgetOpen;
    const chatWindow = document.getElementById('chat-window');
    const toggleBtn = document.getElementById('chat-toggle-btn');

    if (chatWidgetOpen) {
        chatWindow.style.display = 'flex';
        toggleBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        // Focus input
        setTimeout(() => {
            document.getElementById('chat-widget-input').focus();
        }, 100);
    } else {
        chatWindow.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fa-solid fa-robot"></i>';
    }
}

async function handleChatSubmit(e) {
    e.preventDefault();
    
    const input = document.getElementById('chat-widget-input');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message
    addMessageToChat(message, 'user');
    input.value = '';

    // Show typing indicator
    const typingId = addTypingIndicator();

    try {
        // Call AI chat endpoint
        const response = await fetch('/.netlify/functions/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        // Remove typing indicator
        removeTypingIndicator(typingId);

        // Add bot response
        if (data.reply) {
            addMessageToChat(data.reply, 'bot');
        } else {
            addMessageToChat('Sorry, I encountered an error. Please try again.', 'bot');
        }

    } catch (error) {
        console.error('Chat error:', error);
        removeTypingIndicator(typingId);
        addMessageToChat('Sorry, I couldn\'t process your message. Please try again.', 'bot');
    }
}

function addMessageToChat(message, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${sender}-message`;
    messageEl.style.cssText = 'display: flex; gap: 10px; animation: slideUp 0.3s ease;';
    
    if (sender === 'bot') {
        messageEl.innerHTML = `
            <div style="
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: linear-gradient(135deg, #6366f1, #a855f7);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            ">
                <i class="fa-solid fa-robot" style="color: white; font-size: 0.9rem;"></i>
            </div>
            <div style="
                background: rgba(255, 255, 255, 0.05);
                padding: 12px 16px;
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                max-width: 80%;
                color: var(--text);
                line-height: 1.5;
            ">${message}</div>
        `;
    } else {
        messageEl.style.justifyContent = 'flex-end';
        messageEl.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #6366f1, #a855f7);
                padding: 12px 16px;
                border-radius: 12px;
                max-width: 80%;
                color: white;
                line-height: 1.5;
            ">${message}</div>
        `;
    }
    
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const typingId = 'typing-' + Date.now();
    
    const typingEl = document.createElement('div');
    typingEl.id = typingId;
    typingEl.style.cssText = 'display: flex; gap: 10px; animation: slideUp 0.3s ease;';
    typingEl.innerHTML = `
        <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6366f1, #a855f7);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        ">
            <i class="fa-solid fa-robot" style="color: white; font-size: 0.9rem;"></i>
        </div>
        <div style="
            background: rgba(255, 255, 255, 0.05);
            padding: 12px 16px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: var(--text-muted);
        ">
            <i class="fa-solid fa-ellipsis fa-fade"></i> Thinking...
        </div>
    `;
    
    messagesContainer.appendChild(typingEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return typingId;
}

function removeTypingIndicator(typingId) {
    const typingEl = document.getElementById(typingId);
    if (typingEl) {
        typingEl.remove();
    }
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.toggleChatWidget = toggleChatWidget;
}
