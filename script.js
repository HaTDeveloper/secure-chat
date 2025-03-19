// ===== المتغيرات العامة =====
let currentScreen = 'welcome-screen';
let callTimer = null;
let callSeconds = 0;

// ===== وظائف المساعدة =====

// تبديل الشاشات
function switchScreen(screenId) {
    document.querySelector(`.screen.active`).classList.remove('active');
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
}

// تنسيق الوقت
function formatTime(date) {
    return date.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// تنسيق مؤقت المكالمة
function formatCallTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// إضافة رسالة إلى المحادثة
function addMessageToChat(message, sender) {
    const messagesContainer = document.getElementById('messages');
    
    if (sender === 'system') {
        const systemMessage = document.createElement('div');
        systemMessage.classList.add('system-message');
        systemMessage.innerHTML = `<p>${message}</p>`;
        messagesContainer.appendChild(systemMessage);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return;
    }
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    if (sender === 'me') {
        messageElement.classList.add('sent');
    } else {
        messageElement.classList.add('received');
    }
    
    const now = new Date();
    
    messageElement.innerHTML = `
        <div class="message-bubble">
            ${message}
        </div>
        <div class="message-time">${formatTime(now)}</div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// بدء مؤقت المكالمة
function startCallTimer() {
    callSeconds = 0;
    document.getElementById('call-timer').textContent = formatCallTime(callSeconds);
    
    callTimer = setInterval(() => {
        callSeconds++;
        document.getElementById('call-timer').textContent = formatCallTime(callSeconds);
    }, 1000);
}

// إيقاف مؤقت المكالمة
function stopCallTimer() {
    if (callTimer) {
        clearInterval(callTimer);
        callTimer = null;
    }
}

// ===== معالجات الأحداث =====
document.addEventListener('DOMContentLoaded', () => {
    // بدء محادثة نصية فورية
    document.getElementById('start-chat-btn').addEventListener('click', () => {
        switchScreen('chat-screen');
        addMessageToChat('تم إنشاء محادثة آمنة ومشفرة. يمكنك الآن بدء المحادثة.', 'system');
    });
    
    // بدء مكالمة صوتية فورية
    document.getElementById('start-voice-btn').addEventListener('click', () => {
        switchScreen('voice-screen');
        startCallTimer();
    });
    
    // إرسال رسالة
    document.getElementById('send-message').addEventListener('click', () => {
        const messageText = document.getElementById('message-text').value.trim();
        
        if (!messageText) return;
        
        // إضافة الرسالة إلى المحادثة
        addMessageToChat(messageText, 'me');
        
        // محاكاة استلام الرد
        setTimeout(() => {
            addMessageToChat('تم استلام رسالتك بنجاح. هذه محادثة آمنة ومشفرة.', 'other');
        }, 1000);
        
        // مسح حقل الإدخال
        document.getElementById('message-text').value = '';
    });
    
    // معالج ضغط Enter لإرسال الرسالة
    document.getElementById('message-text').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('send-message').click();
        }
    });
    
    // إنهاء المحادثة
    document.getElementById('leave-chat').addEventListener('click', () => {
        if (confirm('هل أنت متأكد من رغبتك في إنهاء المحادثة؟')) {
            switchScreen('welcome-screen');
            
            // إعادة تعيين شاشة المحادثة
            document.getElementById('messages').innerHTML = '';
        }
    });
    
    // أزرار المكالمة الصوتية
    document.getElementById('mute-btn').addEventListener('click', function() {
        this.textContent = this.textContent.includes('كتم') ? '🔊 إلغاء الكتم' : '🔇 كتم';
    });
    
    document.getElementById('speaker-btn').addEventListener('click', function() {
        this.textContent = this.textContent.includes('مكبر') ? '🔈 إلغاء مكبر الصوت' : '🔊 مكبر الصوت';
    });
    
    document.getElementById('end-call-btn').addEventListener('click', () => {
        if (confirm('هل أنت متأكد من رغبتك في إنهاء المكالمة؟')) {
            stopCallTimer();
            switchScreen('welcome-screen');
        }
    });
});
