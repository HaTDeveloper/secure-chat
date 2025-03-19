// ===== المتغيرات العامة =====
let currentScreen = 'welcome-screen';
let callTimer = null;
let callSeconds = 0;
let roomId = null;
let localStream = null;
let peerConnections = {};
let isAudioMuted = false;
let isSpeakerOn = true;

// ===== إعدادات WebRTC =====
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
};

// ===== وظائف المساعدة =====

// إنشاء معرف فريد
function generateUniqueId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// تبديل الشاشات
function switchScreen(screenId) {
    document.querySelector(`.screen.active`).classList.remove('active');
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
}

// تنسيق مؤقت المكالمة
function formatCallTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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

// تحديث حالة الاتصال
function updateConnectionStatus(status, isError = false) {
    const connectionStatus = document.getElementById('connection-status');
    connectionStatus.textContent = status;
    
    connectionStatus.classList.remove('connected', 'error');
    if (isError) {
        connectionStatus.classList.add('error');
    } else if (status === 'متصل') {
        connectionStatus.classList.add('connected');
    }
}

// إضافة مشارك جديد
function addParticipant(id, name = 'مشارك') {
    const participantsContainer = document.getElementById('participants');
    
    const participantElement = document.createElement('div');
    participantElement.classList.add('participant');
    participantElement.id = `participant-${id}`;
    
    participantElement.innerHTML = `
        <div class="participant-avatar">👤</div>
        <div class="participant-name">${name}</div>
    `;
    
    participantsContainer.appendChild(participantElement);
}

// إزالة مشارك
function removeParticipant(id) {
    const participantElement = document.getElementById(`participant-${id}`);
    if (participantElement) {
        participantElement.remove();
    }
}

// تحديث حالة المشارك
function updateParticipantStatus(id, isSpeaking, isMuted) {
    const participantElement = document.getElementById(`participant-${id}`);
    if (!participantElement) return;
    
    if (isSpeaking) {
        participantElement.classList.add('speaking');
    } else {
        participantElement.classList.remove('speaking');
    }
    
    if (isMuted) {
        participantElement.classList.add('muted');
    } else {
        participantElement.classList.remove('muted');
    }
}

// ===== وظائف WebRTC =====

// الحصول على الصوت المحلي
async function getLocalAudio() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStream = stream;
        addParticipant('local', 'أنت');
        return stream;
    } catch (error) {
        console.error('Error accessing media devices:', error);
        updateConnectionStatus('فشل في الوصول إلى الميكروفون. يرجى التحقق من إعدادات الميكروفون والسماح بالوصول.', true);
        throw error;
    }
}

// إنشاء اتصال نظير
function createPeerConnection(peerId) {
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnections[peerId] = peerConnection;
    
    // إضافة المسارات المحلية
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
    
    // معالجة حدث ice candidate
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            // في تطبيق حقيقي، أرسل candidate إلى الطرف الآخر عبر خادم الإشارة
            console.log('New ICE candidate:', event.candidate);
        }
    };
    
    // معالجة حدث تغيير حالة الاتصال
    peerConnection.onconnectionstatechange = () => {
        console.log('Connection state change:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
            updateConnectionStatus('متصل');
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed') {
            updateConnectionStatus('انقطع الاتصال', true);
        }
    };
    
    // معالجة حدث استلام مسار
    peerConnection.ontrack = event => {
        // إضافة المشارك الجديد
        addParticipant(peerId);
        
        // إضافة الصوت إلى عنصر الصوت
        const audioElement = document.createElement('audio');
        audioElement.srcObject = event.streams[0];
        audioElement.autoplay = true;
        document.body.appendChild(audioElement);
    };
    
    return peerConnection;
}

// إنشاء عرض
async function createOffer(peerId) {
    const peerConnection = createPeerConnection(peerId);
    
    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        // في تطبيق حقيقي، أرسل العرض إلى الطرف الآخر عبر خادم الإشارة
        console.log('Created offer:', offer);
        return offer;
    } catch (error) {
        console.error('Error creating offer:', error);
        updateConnectionStatus('فشل في إنشاء عرض الاتصال', true);
        throw error;
    }
}

// معالجة العرض المستلم
async function handleOffer(peerId, offer) {
    const peerConnection = createPeerConnection(peerId);
    
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        // في تطبيق حقيقي، أرسل الإجابة إلى الطرف الآخر عبر خادم الإشارة
        console.log('Created answer:', answer);
        return answer;
    } catch (error) {
        console.error('Error handling offer:', error);
        updateConnectionStatus('فشل في معالجة عرض الاتصال', true);
        throw error;
    }
}

// معالجة الإجابة المستلمة
async function handleAnswer(peerId, answer) {
    const peerConnection = peerConnections[peerId];
    if (!peerConnection) {
        console.error('No peer connection for:', peerId);
        return;
    }
    
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Successfully set remote description');
    } catch (error) {
        console.error('Error handling answer:', error);
        updateConnectionStatus('فشل في معالجة إجابة الاتصال', true);
        throw error;
    }
}

// معالجة ICE candidate المستلم
async function handleIceCandidate(peerId, candidate) {
    const peerConnection = peerConnections[peerId];
    if (!peerConnection) {
        console.error('No peer connection for:', peerId);
        return;
    }
    
    try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('Successfully added ICE candidate');
    } catch (error) {
        console.error('Error handling ICE candidate:', error);
        throw error;
    }
}

// إنهاء جميع الاتصالات
function closeAllConnections() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    Object.values(peerConnections).forEach(connection => {
        connection.close();
    });
    
    peerConnections = {};
}

// ===== معالجات الأحداث =====
document.addEventListener('DOMContentLoaded', () => {
    // بدء مكالمة صوتية
    document.getElementById('start-voice-btn').addEventListener('click', async () => {
        const roomIdInput = document.getElementById('room-id-input').value.trim();
        roomId = roomIdInput || generateUniqueId();
        
        document.getElementById('room-id-display').textContent = `معرف الغرفة: ${roomId}`;
        
        try {
            updateConnectionStatus('جاري الاتصال...');
            await getLocalAudio();
            
            // في تطبيق حقيقي، هنا ستتصل بخادم الإشارة وتنضم إلى الغرفة
            
            switchScreen('voice-screen');
            startCallTimer();
            
            // محاكاة الاتصال الناجح بعد ثانيتين
            setTimeout(() => {
                updateConnectionStatus('متصل');
                // محاكاة إضافة مشارك آخر
                addParticipant('remote-1', 'مشارك 1');
            }, 2000);
            
        } catch (error) {
            console.error('Failed to start call:', error);
            alert('فشل في بدء المكالمة. يرجى التحقق من إعدادات الميكروفون والسماح بالوصول.');
        }
    });
    
    // نسخ معرف الغرفة
    document.getElementById('copy-room-id').addEventListener('click', () => {
        navigator.clipboard.writeText(roomId).then(() => {
            alert('تم نسخ معرف الغرفة إلى الحافظة');
        });
    });
    
    // كتم/إلغاء كتم الصوت
    document.getElementById('mute-btn').addEventListener('click', function() {
        if (localStream) {
            isAudioMuted = !isAudioMuted;
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !isAudioMuted;
            });
            
            this.textContent = isAudioMuted ? '🔊 إلغاء الكتم' : '🔇 كتم';
            updateParticipantStatus('local', false, isAudioMuted);
        }
    });
    
    // تشغيل/إيقاف مكبر الصوت
    document.getElementById('speaker-btn').addEventListener('click', function() {
        isSpeakerOn = !isSpeakerOn;
        
        // في تطبيق حقيقي، هنا ستتحكم في مستوى صوت عناصر الصوت
        document.querySelectorAll('audio').forEach(audio => {
            audio.muted = !isSpeakerOn;
        });
        
        this.textContent = isSpeakerOn ? '🔊 مكبر الصوت' : '🔈 إيقاف مكبر الصوت';
    });
    
    // إنهاء المكالمة
    document.getElementById('end-call-btn').addEventListener('click', () => {
        if (confirm('هل أنت متأكد من رغبتك في إنهاء المكالمة؟')) {
            stopCallTimer();
            closeAllConnections();
            document.getElementById('participants').innerHTML = '';
            switchScreen('welcome-screen');
        }
    });
});
