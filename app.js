// ============================================
// BRANDEMEN - APPLICATION LOGIC
// P2P WebRTC Chat System
// ============================================

// Premium Anonymous Username Generator
const premiumAdjectives = [
    'Resilient', 'Wise', 'Steady', 'Brave', 'Keen', 'Bold', 'Solid', 'Calm',
    'True', 'Bright', 'Sharp', 'Deep', 'Strong', 'Clear', 'Pure', 'Firm',
    'Swift', 'Bold', 'Proud', 'Grand', 'Noble', 'Royal', 'Bold', 'Prime'
];

const premiumNouns = [
    'Oak', 'Anchor', 'Compass', 'Tide', 'Peak', 'Eagle', 'Lion', 'Stone',
    'Storm', 'Flame', 'River', 'Storm', 'Blade', 'Shield', 'Beacon', 'Star',
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
    // Add more patterns as needed
];

function moderateMessage(text) {
    const lowerText = text.toLowerCase();
    
    // Check banned patterns
    for (const pattern of bannedPatterns) {
        if (pattern.test(lowerText)) {
            return { safe: false, reason: 'This message contains concerning content. Please seek help instead.' };
        }
    }
    
    // Check length
    if (text.length > 500) {
        return { safe: false, reason: 'Message is too long. Please keep it under 500 characters.' };
    }
    
    // Check for empty or whitespace-only
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
    peers: new Map(),
    onlineUsers: new Set(),
    typingUsers: new Map(),
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

// BroadcastChannel-based Multi-Tab Communication System
class BroadcastChannelChat {
    constructor() {
        this.channel = null;
        this.init();
    }

    init() {
        // Check if BroadcastChannel is supported
        if (typeof BroadcastChannel !== 'undefined') {
            this.channel = new BroadcastChannel('brandemen_chat');
            
            this.channel.onmessage = (event) => {
                this.handleMessage(event.data);
            };
            
            // Announce presence immediately
            this.sendPresence();
            
            // Send user-joined notification
            setTimeout(() => {
                this.channel.postMessage({
                    type: 'user-joined',
                    userId: appState.userId,
                    username: appState.username,
                    timestamp: Date.now()
                });
            }, 500);
            
            // Send presence every 10 seconds to stay "online"
            setInterval(() => this.sendPresence(), 10000);
        } else {
            console.warn('BroadcastChannel not supported');
        }
    }

    handleMessage(data) {
        try {
            if (data.type === 'chat') {
                // Don't process our own messages
                if (data.userId !== appState.userId) {
                    app.addMessage(data, false);
                }
            } else if (data.type === 'presence') {
                // Update last seen timestamp for all users
                app.userLastSeen.set(data.userId, Date.now());
                
                // Add user to online set if not already there
                if (data.userId !== appState.userId) {
                    if (!app.onlineUsersSet.has(data.userId)) {
                        app.onlineUsersSet.add(data.userId);
                    }
                    // Update count (onlineUsersSet size already includes current user)
                    app.updateOnlineCount(app.onlineUsersSet.size);
                }
            } else if (data.type === 'user-joined') {
                if (data.userId !== appState.userId) {
                    app.addSystemMessage(`${data.username} joined`);
                }
            }
        } catch (e) {
            console.error('Error handling message:', e);
        }
    }

    sendMessage(text, room) {
        if (!this.channel) return;
        
        const messageData = {
            type: 'chat',
            userId: appState.userId,
            username: appState.username,
            room: room || appState.currentRoom, // Use passed room or fallback to current
            text: text,
            timestamp: Date.now()
        };

        this.channel.postMessage(messageData);
    }

    sendPresence() {
        if (!this.channel) return;
        
        this.channel.postMessage({
            type: 'presence',
            userId: appState.userId,
            username: appState.username,
            timestamp: Date.now()
        });
    }

}

// Main Application
const app = {
    chatSystem: null, // Will be initialized after user setup
    onlineUsersSet: new Set(), // Track online users
    userLastSeen: new Map(), // Track when users were last seen
    
    init() {
        // Clear any stale data
        this.onlineUsersSet.clear();
        this.userLastSeen.clear();
        
        this.setupUser();
        this.chatSystem = new BroadcastChannelChat();
        this.setupEventListeners();
        this.hideLoadingScreen();
        this.showWelcomeModal();
        this.updateConnectionStatus('connected');
        this.startOnlineUserTracking();
        this.startUserCleanup();
    },

    startOnlineUserTracking() {
        // Track online users from presence messages
        setInterval(() => {
            // Count unique users (including self)
            const count = Math.max(1, this.onlineUsersSet.size);
            this.updateOnlineCount(count);
        }, 2000);
    },

    startUserCleanup() {
        // Remove users who haven't sent presence for 20 seconds
        setInterval(() => {
            const now = Date.now();
            const TIMEOUT = 20000; // 20 seconds
            
            this.userLastSeen.forEach((lastSeen, userId) => {
                if (userId !== appState.userId && (now - lastSeen) > TIMEOUT) {
                    this.onlineUsersSet.delete(userId);
                    this.userLastSeen.delete(userId);
                    // Update count after removal
                    const count = Math.max(1, this.onlineUsersSet.size);
                    this.updateOnlineCount(count);
                }
            });
        }, 5000); // Check every 5 seconds
    },

    setupUser() {
        // Generate or retrieve user ID
        const storedUserId = sessionStorage.getItem('brandemen_userId');
        appState.userId = storedUserId || 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        if (!storedUserId) {
            sessionStorage.setItem('brandemen_userId', appState.userId);
        }
        
        // Generate premium username
        appState.username = generatePremiumName();
        
        // Add to online users
        appState.onlineUsers.add(appState.userId);
        this.onlineUsersSet.add(appState.userId);
        this.userLastSeen.set(appState.userId, Date.now());
        this.updateOnlineCount(1);
        
        // Update welcome modal with username
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

        document.getElementById('closeGuidelines')?.addEventListener('click', () => {
            document.getElementById('guidelinesModal').classList.add('hidden');
        });

        document.getElementById('acceptGuidelines')?.addEventListener('click', () => {
            document.getElementById('guidelinesModal').classList.add('hidden');
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
        
        // Update room buttons
        document.querySelectorAll('.room-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.room === roomId) {
                btn.classList.add('active');
            }
        });
        
        // Update room name in empty state
        const roomNameEl = document.getElementById('currentRoomName');
        if (roomNameEl) {
            roomNameEl.textContent = appState.roomNames[roomId];
        }
        
        // Clear messages (in a real P2P app, you'd fetch room-specific messages)
        this.renderMessages();
    },

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const text = messageInput.value.trim();
        
        if (!text) return;
        
        // Moderate message
        const moderation = moderateMessage(text);
        if (!moderation.safe) {
            this.showNotification(moderation.reason);
            return;
        }
        
        // Create message object
        const message = {
            userId: appState.userId,
            username: appState.username,
            text: text,
            timestamp: Date.now(),
            room: appState.currentRoom
        };
        
        // Add to local state (shows immediately)
        this.addMessage(message, true);
        
        // Send via BroadcastChannel to other tabs with the correct room
        if (this.chatSystem) {
            this.chatSystem.sendMessage(text, appState.currentRoom);
        }
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        // Update char count
        document.getElementById('charCount').textContent = '0/500';
        
        // Play sound (optional)
        this.playSound('send');
    },

    addMessage(messageData, isOwn = false) {
        // Ensure message has a room property
        if (!messageData.room) {
            messageData.room = appState.currentRoom;
        }
        
        const messageKey = `${messageData.userId}_${messageData.timestamp}`;
        appState.messages.set(messageKey, messageData);
        
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
            room: appState.currentRoom // Add room to system messages
        };
        
        this.addMessage(message, false);
    },

    renderMessages() {
        const messagesWrapper = document.getElementById('messagesWrapper');
        const emptyState = document.getElementById('emptyState');
        
        // Filter messages for current room - only show messages that match exactly
        const roomMessages = Array.from(appState.messages.values())
            .filter(msg => {
                // Only show messages that have a room property AND match the current room
                // Ignore messages without a room property or with different room
                return msg.room && msg.room === appState.currentRoom;
            })
            .sort((a, b) => a.timestamp - b.timestamp);
        
        // Always clear existing messages first
        messagesWrapper.innerHTML = '';
        
        if (roomMessages.length === 0) {
            emptyState?.classList.remove('hidden');
            return;
        }
        
        emptyState?.classList.add('hidden');
        
        // Render messages
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
        // Basic formatting: links, line breaks
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
        // Create temporary notification
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
        // Optional sound feedback
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
            // Sound not supported or user preference
        }
    }
};

// Add CSS animations for notifications
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

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Add some demo messages for testing
setTimeout(() => {
    app.addSystemMessage('Welcome to Brandemen. Share what\'s on your mind, or offer support to others.');
}, 2500);
