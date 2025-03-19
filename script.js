// ===== المتغيرات العامة =====
let currentScreen = 'welcome-screen';
let currentRoomId = null;
let encryptionKey = null;
let messageTimeout = 10; // الوقت الافتراضي بالدقائق

// ===== وظائف المساعدة =====

// إنشاء معرف فريد
function generateUniqueId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// إنشاء مفتاح تشفير
function generateEncryptionKey() {
    return CryptoJS.lib.WordArray.random(16).toString();
}

// تشفير الرسالة
function encryptMessage(message, key) {
    return CryptoJS.AES.encrypt(message, key).toString();
}

// فك تشفير الرسالة
function decryptMessage(encryptedMessage, key) {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    return bytes.toString(CryptoJS.enc.Utf8);
}

// تنسيق الوقت
function formatTime(date) {
    return date.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// تبديل الشاشات
function switchScreen(screenId) {
    document.querySelector(`.screen.active`).classList.remove('active');
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
}

// إضافة رسالة إلى المحادثة
function addMessageToChat(message, sender, encrypted = true) {
    const messagesContainer = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    if (sender === 'me') {
        messageElement.classList.add('sent');
    } else if (sender === 'system') {
        const systemMessage = document.createElement('div');
        systemMessage.classList.add('system-message');
        systemMessage.innerHTML = `<p>${message}</p>`;
        messagesContainer.appendChild(systemMessage);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return;
    } else {
        messageElement.classList.add('received');
    }
    
    // فك تشفير الرسالة إذا كانت مشفرة
    let displayMessage = message;
    if (encrypted && encryptionKey && sender !== 'me') {
        try {
            displayMessage = decryptMessage(message, encryptionKey);
        } catch (e) {
            displayMessage = "❌ فشل في فك تشفير الرسالة";
        }
    }
    
    const now = new Date();
    
    messageElement.innerHTML = `
        <div class="message-bubble">
            ${displayMessage}
        </div>
        <div class="message-time">${formatTime(now)}</div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // إعداد مؤقت لحذف الرسالة إذا كان هناك مهلة
    if (messageTimeout > 0) {
        setTimeout(() => {
            messageElement.classList.add('fading');
            setTimeout(() => {
                messagesContainer.removeChild(messageElement);
            }, 500);
        }, messageTimeout * 60 * 1000); // تحويل الدقائق إلى مللي ثانية
    }
}

// ===== معالجات الأحداث =====
document.addEventListener('DOMContentLoaded', () => {
    // أزرار الشاشة الرئيسية
    document.getElementById('create-room-btn').addEventListener('click', () => {
        switchScreen('create-room-screen');
    });
    
    document.getElementById('join-room-btn').addEventListener('click', () => {
        switchScreen('join-room-screen');
    });
    
    // أزرار الرجوع
    document.querySelectorAll('.back-btn').forEach(button => {
        button.addEventListener('click', () => {
            switchScreen('welcome-screen');
        });
    });
    
    // إنشاء غرفة جديدة
    document.getElementById('create-room-submit').addEventListener('click', () => {
        const roomName = document.getElementById('room-name').value || 'غرفة محادثة آمنة';
        messageTimeout = parseInt(document.getElementById('message-timeout').value);
        
        // إنشاء معرف الغرفة ومفتاح التشفير
        currentRoomId = generateUniqueId();
        encryptionKey = generateEncryptionKey();
        
        // تحديث واجهة المستخدم
        document.getElementById('room-title').textContent = roomName;
        document.getElementById('room-id-display').textContent = `معرف الغرفة: ${currentRoomId}`;
        document.getElementById('timeout-value').textContent = 
            messageTimeout > 0 ? `${messageTimeout} دقائق` : 'لا تنتهي';
        
        // الانتقال إلى شاشة المحادثة
        switchScreen('chat-screen');
        
        // إضافة رسالة نظام
        addMessageToChat('تم إنشاء الغرفة وتأمينها بنجاح. شارك معرف الغرفة مع الشخص الذي تريد التحدث معه.', 'system');
        addMessageToChat(`مفتاح التشفير: ${encryptionKey}`, 'system');
        addMessageToChat('لا تشارك هذا المفتاح مع أي شخص آخر!', 'system');
    });
    
    // الانضمام إلى غرفة
    document.getElementById('join-room-submit').addEventListener('click', () => {
        const roomId = document.getElementById('room-id').value.trim();
        
        if (!roomId) {
            alert('الرجاء إدخال معرف الغرفة');
            return;
        }
        
        // في تطبيق حقيقي، هنا ستتحقق من وجود الغرفة على الخادم
        currentRoomId = roomId;
        
        // طلب مفتاح التشفير
        const key = prompt('أدخل مفتاح التشفير الذي شاركه معك منشئ الغرفة:');
        if (key) {
            encryptionKey = key;
            
            // تحديث واجهة المستخدم
            document.getElementById('room-title').textContent = 'غرفة محادثة آمنة';
            document.getElementById('room-id-display').textContent = `معرف الغرفة: ${currentRoomId}`;
            
            // الانتقال إلى شاشة المحادثة
            switchScreen('chat-screen');
            
            // إضافة رسالة نظام
            addMessageToChat('تم الانضمام إلى الغرفة بنجاح.', 'system');
        }
    });
    
    // إرسال رسالة
    document.getElementById('send-message').addEventListener('click', () => {
        const messageText = document.getElementById('message-text').value.trim();
        
        if (!messageText) return;
        
        // في تطبيق حقيقي، هنا سترسل الرسالة المشفرة إلى الخادم
        const encryptedMessage = encryptMessage(messageText, encryptionKey);
        
        // إضافة الرسالة إلى المحادثة
        addMessageToChat(messageText, 'me', false);
        
        // محاكاة استلام الرد (في تطبيق حقيقي، هذا سيأتي من الخادم)
        setTimeout(() => {
            // هنا نتظاهر بأن الرسالة المشفرة قد وصلت من الطرف الآخر
            addMessageToChat(encryptedMessage, 'other');
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
    
    // نسخ معرف الغرفة
    document.getElementById('copy-room-id').addEventListener('click', () => {
        const roomIdText = currentRoomId;
        navigator.clipboard.writeText(roomIdText).then(() => {
            alert('تم نسخ معرف الغرفة إلى الحافظة');
        });
    });
    
    // مغادرة الغرفة
    document.getElementById('leave-room').addEventListener('click', () => {
        if (confirm('هل أنت متأكد من رغبتك في مغادرة الغرفة؟')) {
            currentRoomId = null;
            encryptionKey = null;
            switchScreen('welcome-screen');
            
            // إعادة تعيين شاشة المحادثة
            document.getElementById('messages').innerHTML = '';
        }
    });
});
