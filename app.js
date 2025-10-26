// ============================================
// BRANDEMEN - NATIVE WEBSOCKET CLIENT
// Real-time cross-device messaging (FREE on Render.com)
// ============================================

// Premium Anonymous Username Generator
const premiumAdjectives = [
    'Resilient', 'Wise', 'Steady', 'Brave', 'Keen', 'Bold', 'Solid', 'Calm',
    'True', 'Bright', 'Sharp', 'Deep', 'Strong', 'Clear', 'Pure', 'Firm',
    'Swift', 'Proud', 'Grand', 'Noble', 'Royal', 'Prime'
];

const premiumNouns = [
    'Oak', 'Anchor', 'Compass', 'Tide', 'Peak', 'Eagle', 'Lion', 'Stone',
    'Storm', 'Flame', 'River', 'Blade', 'Shield', 'Beacon', 'Star',
    'Crown', 'Dawn', 'Light', 'Wave', 'Rock', 'Cliff', 'Wind', 'Sun'
];

function generatePremiumName() {
    const adj = premiumAdjectives[Math.floor(Math.random() * premiumAdjectives.length)];
    const noun = premiumNouns[Math.floor(Math.random() * premiumNouns.length)];
    return adj + noun;
}

// Safety & Moderation System
const bannedPatterns = [
    /\b(suicide|kill\s*myself|self\s*harm|end\s*it\s*all)/gi,
    /\b(die|dead|death|murder)/gi,
];

function moderateMessage(text) {
    const lowerText = text.toLowerCase();
    
    for (const pattern of bannedPatterns) {
        if (pattern.test(lowerText)) {
            return { safe: false, reason: 'This message contains concerning content. Please seek help instead.' };
        }
    }
    
    if (text.length > 500) {
        return { safe: false, reason: 'Message is too long. Please keep it under 500 characters.' };
    }
    
    if (!text.trim()) {
        return { safe: false, reason: 'Empty messages are not allowed.' };
    }
    
    return { safe: true };
}

// Application State
const appState = {
    userId: null,
    username: null,
    currentRoom: 'venting',
    messages: new Map(),
    connectionStatus: 'connecting',
    
    roomNames: {
        venting: 'Venting Space',
        advice: 'Bro Advice',
        struggles: 'Daily Struggles',
        success: 'Success Stories',
        questions: 'Q&A',
        health: 'Health',
        finance: 'Finance'
    }
};

// Native WebSocket Client
class WebSocketChat {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.userId = null;
        this.username = null;
        this.currentRoom = appState.currentRoom;
        
        this.connect();
    }

    connect() {
        try {
            // Get server URL - update this with your Render.com URL after deployment
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const WS_URL = isLocal 
                ? 'ws://localhost:3000'
                : 'wss://your-app-name.onrender.com'; // Update this!
            
            this.ws = new WebSocket(WS_URL);
            
            this.ws.onopen = () => {
                console.log('✅ Connected to Brandemen server');
                this.reconnectAttempts = 0;
                app.updateConnectionStatus('connected');
                
                // Join current room
                this.joinRoom(this.currentRoom);
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Message parsing error:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('❌ Connection closed');
                app.updateConnectionStatus('connecting');
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

        } catch (error) {
            console.error('Connection failed:', error);
            this.attemptReconnect();
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'welcome':
                console.log('Server:', data.message);
                break;
                
            case 'chat-message':
                if (data.room === this.currentRoom) {
                    app.addMessage({
                        userId: data.userId,
                        username: data.username,
                        text: data.text,
                        room: data.room,
                        timestamp: data.timestamp
                    }, data.userId !== this.userId);
                }
                break;
                
            case 'user-joined':
                if (data.room === this.currentRoom) {
                    app.addSystemMessage(`${data.username} joined the room`);
                    app.updateOnlineCount(data.onlineCount);
                }
                break;
                
            case 'user-left':
                if (data.room === this.currentRoom) {
                    app.updateOnlineCount(data.onlineCount);
                }
                break;

            case 'user-count':
                app.updateOnlineCount(data.count);
                break;
        }
    }

    joinRoom(roomId) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.currentRoom = roomId;
            this.ws.send(JSON.stringify({
                type: 'join-room',
                room: roomId,
                username: this.username,
                userId: this.userId
            }));
        }
    }

    sendMessage(text) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'chat-message',
                text: text,
                username: this.username,
                userId: this.userId,
                room: this.currentRoom
            }));
            return true;
        }
        return false;
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
        }
    }
}

// Main Application
const app = {
    chatSystem: null,
    messages: new Map(),
    
    init() {
        this.setupUser();
        this.chatSystem = new WebSocketChat();
        this.chatSystem.userId = appState.userId;
        this.chatSystem.username = appState.username;
        this.setupEventListeners();
        this.hideLoadingScreen();
        this.showWelcomeModal();
    },

    setupUser() {
        const storedUserId = sessionStorage.getItem('brandemen_userId');
        appState.userId = storedUserId || 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        if (!storedUserId) {
            sessionStorage.setItem('brandemen_userId', appState.userId);
        }
        
        appState.username = generatePremiumName();
        
        // Update welcome modal
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = appState.username;
        }
    },

    setupEventListeners() {
        // Room navigation
        document.querySelectorAll('.room-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const room = e.currentTarget.dataset.room;
                this.switchRoom(room);
            });
        });

        // Message input
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const charCount = document.getElementById('charCount');

        messageInput.addEventListener('input', (e) => {
            const length = e.target.value.length;
            charCount.textContent = `${length}/500`;
            
            // Auto-resize textarea
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
        });

        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        sendBtn.addEventListener('click', () => this.sendMessage());

        // Modal controls
        document.getElementById('startChatting')?.addEventListener('click', () => {
            document.getElementById('welcomeModal').classList.add('hidden');
        });

        document.getElementById('closeWelcome')?.addEventListener('click', () => {
            document.getElementById('welcomeModal').classList.add('hidden');
        });
    },

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        }, 2000);
    },

    showWelcomeModal() {
        const hasSeenWelcome = sessionStorage.getItem('brandemen_welcome_seen');
        if (!hasSeenWelcome) {
            const modal = document.getElementById('welcomeModal');
            if (modal) {
                modal.classList.remove('hidden');
                sessionStorage.setItem('brandemen_welcome_seen', 'true');
            }
        }
    },

    switchRoom(roomId) {
        appState.currentRoom = roomId;
        
        // Update UI
        document.querySelectorAll('.room-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.room === roomId) {
                btn.classList.add('active');
            }
        });
        
        const roomNameEl = document.getElementById('currentRoomName');
        if (roomNameEl) {
            roomNameEl.textContent = appState.roomNames[roomId];
        }
        
        // Join new room on server
        if (this.chatSystem) {
            this.chatSystem.joinRoom(roomId);
        }
        
        this.renderMessages();
    },

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const text = messageInput.value.trim();
        
        if (!text) return;
        
        const moderation = moderateMessage(text);
        if (!moderation.safe) {
            this.showNotification(moderation.reason);
            return;
        }
        
        const message = {
            userId: appState.userId,
            username: appState.username,
            text: text,
            timestamp: Date.now(),
            room: appState.currentRoom
        };
        
        // Add to local state immediately
        this.addMessage(message, true);
        
        // Send via WebSocket
        if (this.chatSystem) {
            this.chatSystem.sendMessage(text);
        }
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        document.getElementById('charCount').textContent = '0/500';
        
        this.playSound('send');
    },

    addMessage(messageData, isOwn = false) {
        if (!messageData.room) {
            messageData.room = appState.currentRoom;
        }
        
        const messageKey = `${messageData.userId}_${messageData.timestamp}`;
        this.messages.set(messageKey, messageData);
        
        this.renderMessages();
        this.scrollToBottom();
    },

    addSystemMessage(text) {
        const message = {
            userId: 'system',
            username: 'System',
            text: text,
            timestamp: Date.now(),
            isSystem: true,
            room: appState.currentRoom
        };
        
        this.addMessage(message, false);
    },

    renderMessages() {
        const messagesWrapper = document.getElementById('messagesWrapper');
        const emptyState = document.getElementById('emptyState');
        
        const roomMessages = Array.from(this.messages.values())
            .filter(msg => msg.room && msg.room === appState.currentRoom)
            .sort((a, b) => a.timestamp - b.timestamp);
        
        messagesWrapper.innerHTML = '';
        
        if (roomMessages.length === 0) {
            emptyState?.classList.remove('hidden');
            return;
        }
        
        emptyState?.classList.add('hidden');
        
        roomMessages.forEach(msg => {
            const messageEl = this.createMessageElement(msg, msg.userId === appState.userId);
            messagesWrapper.appendChild(messageEl);
        });
    },

    createMessageElement(message, isOwn) {
        const messageDiv = document.createElement('div');
        const isSystem = message.isSystem || message.userId === 'system';
        messageDiv.className = `message ${isOwn ? 'own-message' : ''} ${isSystem ? 'system-message' : ''}`;
        
        const time = new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <span class="message-username">${this.escapeHtml(message.username)}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-text">${this.formatMessage(message.text)}</div>
            </div>
        `;
        
        return messageDiv;
    },

    formatMessage(text) {
        return this.escapeHtml(text)
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    scrollToBottom() {
        const messagesWrapper = document.getElementById('messagesWrapper');
        messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
    },

    updateConnectionStatus(status) {
        appState.connectionStatus = status;
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.getElementById('statusText');
        
        if (statusDot && statusText) {
            statusDot.classList.toggle('connected', status === 'connected');
            statusText.textContent = status === 'connected' ? 'Connected' : 'Connecting...';
        }
    },

    updateOnlineCount(count) {
        const userCountEl = document.getElementById('userCount');
        if (userCountEl) {
            userCountEl.textContent = count;
        }
    },

    showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--danger);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = type === 'send' ? 800 : 600;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Sound not supported
        }
    }
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Add demo message
setTimeout(() => {
    app.addSystemMessage('Welcome to Brandemen. Real-time cross-device messaging powered by WebSockets!');
}, 2500);
