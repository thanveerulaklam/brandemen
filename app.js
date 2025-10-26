// ============================================
// BRANDEMEN - ABLY REAL-TIME CHAT
// Global, cross-device, actually works!
// ============================================

// Premium Username Generator
const premiumAdjectives = ['Resilient', 'Wise', 'Steady', 'Brave', 'Solid', 'Calm', 'Strong', 'True', 'Bold', 'Bright'];
const premiumNouns = ['Oak', 'Anchor', 'Compass', 'Rock', 'Light', 'Star', 'Mountain', 'River', 'Eagle', 'Blade'];

function generatePremiumName() {
    const adj = premiumAdjectives[Math.floor(Math.random() * premiumAdjectives.length)];
    const noun = premiumNouns[Math.floor(Math.random() * premiumNouns.length)];
    return adj + noun + Math.floor(Math.random() * 100);
}

// Safety & Moderation
function moderateMessage(text) {
    const banned = ['suicide', 'kill myself', 'self harm', 'harm', 'hurt', 'violence'];
    const lower = text.toLowerCase();
    
    for (const word of banned) {
        if (lower.includes(word)) {
            return { safe: false, reason: 'Please keep conversations supportive and safe' };
        }
    }
    
    if (text.length > 500) return { safe: false, reason: 'Message too long (max 500 characters)' };
    if (!text.trim()) return { safe: false, reason: 'Empty messages not allowed' };
    
    return { safe: true };
}

// Ably Real-time Chat Manager
class AblyChatManager {
    constructor() {
        this.ably = null;
        this.channel = null;
        this.userId = this.generateUserId();
        this.username = generatePremiumName();
        this.currentRoom = 'venting';
        this.onlineUsers = new Set();
        
        this.init();
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async init() {
        try {
            // Replace with your actual Ably API key
            const ABLY_API_KEY = '8u_bOg.66ydkQ:gnrFZ_mnV1OYc8TVCiCjREMP65tsAP2F0vVpQx_o1kc'; // ← REPLACE THIS
            
            this.ably = new Ably.Realtime({
                key: ABLY_API_KEY,
                clientId: this.userId,
                echoMessages: false // Don't receive our own messages
            });

            this.ably.connection.on('connected', () => {
                console.log('✅ Connected to Ably');
                app.updateConnectionStatus('connected');
                this.joinRoom(this.currentRoom);
                
                // Update online count
                this.updatePresence();
            });

            this.ably.connection.on('failed', () => {
                console.log('❌ Failed to connect to Ably');
                app.updateConnectionStatus('disconnected');
            });

            this.ably.connection.on('disconnected', () => {
                console.log('⚠️ Disconnected from Ably');
                app.updateConnectionStatus('connecting');
            });

        } catch (error) {
            console.error('Error initializing Ably:', error);
            app.showNotification('Failed to connect to chat service');
        }
    }

    async joinRoom(roomId) {
        try {
            // Leave previous room if exists
            if (this.channel) {
                try {
                    await this.channel.presence.leave();
                    this.channel.unsubscribe();
                } catch (error) {
                    console.error('Error leaving previous room:', error);
                }
            }

            this.currentRoom = roomId;
            const channelName = `brandemen:${roomId}`;
            
            this.channel = this.ably.channels.get(channelName);
        } catch (error) {
            console.error('Error setting up channel:', error);
            throw error;
        }
        
        // Subscribe to messages
        this.channel.subscribe('chat-message', (message) => {
            this.handleChatMessage(message.data);
        });
        
        // Subscribe to typing indicators
        this.channel.subscribe('typing', (message) => {
            this.handleTyping(message.data);
        });

        // Set up presence
        try {
            await this.channel.presence.enter({
                userId: this.userId,
                username: this.username,
                room: roomId,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Error entering presence:', error);
        }

        // Listen for presence updates
        this.channel.presence.subscribe('enter', (member) => {
            if (member && member.data) {
                this.handleUserJoined(member.data);
            }
        });

        this.channel.presence.subscribe('leave', (member) => {
            if (member && member.data) {
                this.handleUserLeft(member.data);
            }
        });

        // Get current members
        try {
            const members = await this.channel.presence.get();
            if (members && Array.isArray(members)) {
                members.forEach(member => {
                    if (member && member.data) {
                        this.handleUserJoined(member.data);
                    }
                });
            }
        } catch (error) {
            console.error('Error getting current members:', error);
        }

        console.log(`✅ Joined room: ${roomId}`);
    }

    handleChatMessage(messageData) {
        // Only process messages for current room and not our own
        if (messageData.room && messageData.room === this.currentRoom && messageData.userId !== this.userId) {
            // Ensure room property is set
            if (!messageData.room) {
                messageData.room = this.currentRoom;
            }
            app.addMessage(messageData, false);
        }
    }

    handleUserJoined(userData) {
        if (userData.userId !== this.userId) {
            this.onlineUsers.add(userData.userId);
            app.updateOnlineCount(this.onlineUsers.size + 1); // +1 for ourselves
            
            // Show join notification for current room
            if (userData.room === this.currentRoom) {
                app.showNotification(`${userData.username} joined the room`);
            }
        }
    }

    handleUserLeft(userData) {
        if (userData.userId !== this.userId) {
            this.onlineUsers.delete(userData.userId);
            app.updateOnlineCount(this.onlineUsers.size + 1);
        }
    }

    handleTyping(typingData) {
        if (typingData.userId !== this.userId) {
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) {
                if (typingData.isTyping) {
                    typingIndicator.innerHTML = `<span class="username-typing">${typingData.username}</span> is typing...`;
                } else {
                    typingIndicator.innerHTML = '';
                }
            }
        }
    }

    async sendTyping(isTyping) {
        if (!this.channel) return;
        
        try {
            await this.channel.publish('typing', {
                userId: this.userId,
                username: this.username,
                isTyping: isTyping,
                room: this.currentRoom
            });
        } catch (error) {
            console.error('Error sending typing indicator:', error);
        }
    }

    async sendMessage(text) {
        if (!this.channel) return false;

        const message = {
            type: 'chat',
            userId: this.userId,
            username: this.username,
            text: text,
            room: this.currentRoom,
            timestamp: Date.now()
        };

        try {
            // Add to local UI immediately (optimistic update)
            app.addMessage(message, true);
            
            // Publish to Ably
            await this.channel.publish('chat-message', message);
            return true;
            
        } catch (error) {
            console.error('Error sending message:', error);
            app.showNotification('Failed to send message');
            return false;
        }
    }

    updatePresence() {
        // Presence is automatically maintained by Ably
        // This just updates our local count
        app.updateOnlineCount(this.onlineUsers.size + 1);
    }

    async switchRoom(roomId) {
        try {
            // Join the new room (messages persist in app.messages Map)
            await this.joinRoom(roomId);
            
            // Just render the messages for the current room
            app.renderMessages();
        } catch (error) {
            console.error('Error switching room:', error);
            app.showNotification('Failed to switch room');
        }
    }
}

// Main Application
const app = {
    chatManager: null,
    messages: new Map(),
    
    init() {
        this.setupUser();
        this.chatManager = new AblyChatManager();
        this.setupEventListeners();
        this.hideLoadingScreen();
        this.showWelcomeModal();
        this.updateConnectionStatus('connecting');
        
        // Add welcome message
        setTimeout(() => {
            this.addSystemMessage('Welcome to Brandemen! This is a real global chat - people can connect from anywhere in the world!');
        }, 2000);
    },

    setupUser() {
        let userId = sessionStorage.getItem('brandemen_userId');
        if (!userId) {
            userId = 'user_' + Date.now();
            sessionStorage.setItem('brandemen_userId', userId);
        }
        
        let username = sessionStorage.getItem('brandemen_username');
        if (!username) {
            username = generatePremiumName();
            sessionStorage.setItem('brandemen_username', username);
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

        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        sendBtn.addEventListener('click', () => this.sendMessage());

        // Character count and typing indicator
        let typingTimeout;
        messageInput.addEventListener('input', (e) => {
            const length = e.target.value.length;
            document.getElementById('charCount').textContent = `${length}/500`;
            
            // Send typing indicator
            if (this.chatManager) {
                this.chatManager.sendTyping(true);
                
                // Clear existing timeout
                clearTimeout(typingTimeout);
                
                // Set timeout to stop typing indicator
                typingTimeout = setTimeout(() => {
                    if (this.chatManager) {
                        this.chatManager.sendTyping(false);
                    }
                }, 2000);
            }
        });

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
        }, 2500);
    },

    showWelcomeModal() {
        const hasSeenWelcome = sessionStorage.getItem('brandemen_welcome_seen');
        if (!hasSeenWelcome) {
            const modal = document.getElementById('welcomeModal');
            if (modal) {
                modal.classList.remove('hidden');
                sessionStorage.setItem('brandemen_welcome_seen', 'true');
                
                // Update welcome modal with username
                const userNameEl = document.getElementById('userName');
                if (userNameEl && this.chatManager) {
                    userNameEl.textContent = this.chatManager.username;
                }
            }
        }
    },

    async switchRoom(roomId) {
        if (this.chatManager) {
            await this.chatManager.switchRoom(roomId);
        }
        
        // Update UI
        document.querySelectorAll('.room-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.room === roomId) {
                btn.classList.add('active');
            }
        });
        
        const roomNameEl = document.getElementById('currentRoomName');
        if (roomNameEl) {
            roomNameEl.textContent = this.getRoomName(roomId);
        }
        
        this.renderMessages();
    },

    getRoomName(roomId) {
        const roomNames = {
            'venting': 'Venting Space',
            'advice': 'Bro Advice',
            'struggles': 'Daily Struggles', 
            'success': 'Success Stories',
            'questions': 'Q&A',
            'health': 'Health',
            'finance': 'Finance'
        };
        return roomNames[roomId] || roomId;
    },

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const text = messageInput.value.trim();
        
        if (!text) return;
        
        const moderation = moderateMessage(text);
        if (!moderation.safe) {
            this.showNotification(moderation.reason);
            return;
        }
        
        if (this.chatManager) {
            const success = await this.chatManager.sendMessage(text);
            if (success) {
                messageInput.value = '';
                document.getElementById('charCount').textContent = '0/500';
            }
        }
    },

    addMessage(messageData, isOwn = false) {
        // Ensure every message has a room property
        if (!messageData.room) {
            messageData.room = this.chatManager ? this.chatManager.currentRoom : 'venting';
        }
        
        const messageKey = `${messageData.userId}_${messageData.timestamp}`;
        this.messages.set(messageKey, messageData);
        
        this.renderMessages();
        this.scrollToBottom();
    },

    addSystemMessage(text) {
        const message = {
            userId: 'system',
            username: 'Brandemen',
            text: text,
            timestamp: Date.now(),
            isSystem: true,
            room: this.chatManager ? this.chatManager.currentRoom : 'venting'
        };
        
        this.addMessage(message, false);
    },

    renderMessages() {
        const messagesWrapper = document.getElementById('messagesWrapper');
        const emptyState = document.getElementById('emptyState');
        
        const currentRoom = this.chatManager ? this.chatManager.currentRoom : 'venting';
        
        // Filter messages for current room only
        const roomMessages = Array.from(this.messages.values())
            .filter(msg => {
                // Ensure message has room property and matches current room
                return msg.room && msg.room === currentRoom;
            })
            .sort((a, b) => a.timestamp - b.timestamp);
        
        // Always clear the wrapper first
        messagesWrapper.innerHTML = '';
        
        if (roomMessages.length === 0) {
            emptyState?.classList.remove('hidden');
            return;
        }
        
        emptyState?.classList.add('hidden');
        
        roomMessages.forEach(msg => {
            const messageEl = this.createMessageElement(msg, msg.userId === (this.chatManager?.userId || ''));
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
        return this.escapeHtml(text).replace(/\n/g, '<br>');
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
            background: #ef4444;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            z-index: 10000;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
};

// Initialize app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}
