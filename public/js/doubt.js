// Backend URL configuration
const BACKEND_URL = 'https://caked-production.up.railway.app';
// Audio context for Web Audio API
let audioContext = null;
let currentAudio = null;
let currentPlayingElement = null;

// Initialize audio context
function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.log('Web Audio API not supported');
        }
    }
    return audioContext;
}

// Create falling tears
function createTear() {
    const tear = document.createElement('div');
    tear.className = 'tear';
    tear.innerHTML = '💧';
    tear.style.left = Math.random() * 100 + '%';
    tear.style.animationDuration = (Math.random() * 2 + 2) + 's';
    document.body.appendChild(tear);
    
    setTimeout(() => {
        if (tear.parentNode) {
            tear.remove();
        }
    }, 4000);
}

// Create tears periodically
setInterval(createTear, 800);

// Go back to landing page
function goBackToMain() {
    stopAllAudio();
    // You can customize this to navigate to your main page
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // Fallback navigation
        window.location.href = 'index.html';
    }
}

// Show message modal
function showMessage() {
    const modal = document.getElementById('messageModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

// Hide message modal
function hideMessage() {
    const modal = document.getElementById('messageModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
    }
}

// Show placeholder if image fails to load
function showPlaceholder(num) {
    const frame = document.getElementById(`imageFrame${num}`);
    if (frame) {
        const img = frame.querySelector('img');
        const placeholder = frame.querySelector('.placeholder');
        
        if (img) img.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
    }
}

// Stop all audio
function stopAllAudio() {
    // Stop HTML5 audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    
    // Reset all visual states
    document.querySelectorAll('.music-chaos').forEach(btn => {
        btn.classList.remove('playing', 'pulsing');
    });
    
    const mainHeart = document.getElementById('mainHeart');
    if (mainHeart) {
        mainHeart.classList.remove('playing', 'beating');
    }
    
    hideAudioStatus();
    currentPlayingElement = null;
}

// Show audio status with mobile optimization
function showAudioStatus(message) {
    const status = document.getElementById('audioStatus');
    if (status) {
        status.textContent = message;
        status.classList.add('show');
        
        // Auto-hide on mobile after 3 seconds to save space
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                hideAudioStatus();
            }, 3000);
        }
    }
}

// Hide audio status
function hideAudioStatus() {
    const status = document.getElementById('audioStatus');
    if (status) {
        status.classList.remove('show');
    }
}

// Play audio with fallback and better mobile support
function playAudioWithFallback(audioElement, title, visualElement) {
    if (!audioElement) {
        console.log('Audio element not found');
        return;
    }
    
    stopAllAudio();
    
    currentAudio = audioElement;
    currentPlayingElement = visualElement;
    
    // Add visual feedback with enhanced mobile animations
    if (visualElement) {
        visualElement.classList.add('playing');
        if (visualElement.classList.contains('music-chaos')) {
            visualElement.classList.add('pulsing');
        }
        if (visualElement.id === 'mainHeart') {
            visualElement.classList.add('beating');
        }
    }
    
    showAudioStatus(`🎵 ${title}`);
    
    // Set volume with mobile consideration
    const isMobile = window.innerWidth <= 768;
    audioElement.volume = isMobile ? 0.4 : 0.3;
    
    // Try to play the audio
    const playPromise = audioElement.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            // Audio started successfully
            console.log('Audio playing:', title);
            
            // Add haptic feedback on mobile if available
            if (isMobile && navigator.vibrate) {
                navigator.vibrate(50);
            }
        }).catch(error => {
            console.log('Audio play failed:', error);
            showAudioStatus(`🎵 ${title} (Loading...)`);
        });
    }
    
    // Handle audio end
    audioElement.onended = () => {
        if (visualElement) {
            visualElement.classList.remove('playing', 'pulsing', 'beating');
        }
        hideAudioStatus();
        currentAudio = null;
        currentPlayingElement = null;
    };
    
    // Handle audio error
    audioElement.onerror = () => {
        showAudioStatus(`🎵 ${title} (Error loading)`);
        setTimeout(() => {
            if (visualElement) {
                visualElement.classList.remove('playing', 'pulsing', 'beating');
            }
            hideAudioStatus();
        }, 2000);
    };
}

// Music functionality with updated track list (removed PND track)
function playMusic(num) {
    // Preload audio on demand
    preloadAudioOnDemand(`musicAudio${num}`);
    
    const audioElement = document.getElementById(`musicAudio${num}`);
    const buttonElement = document.getElementById(`musicBtn${num}`);
    const titles = [
        "Amy Winehouse - Back To Black",
        "Don Toliver - Easy",
        "Juice WRLD - Faded", 
        "All Out - Juice WRLD"
    ];
    
    playAudioWithFallback(audioElement, titles[num - 1], buttonElement);
    
    // Create explosion effect
    createMusicExplosion(buttonElement);
}

// Main heart music
function playMainMusic() {
    const audioElement = document.getElementById('mainHeartAudio');
    const heartElement = document.getElementById('mainHeart');
    
    playAudioWithFallback(audioElement, "You've Been Missed - PARTYNEXTDOOR", heartElement);
    
    // Create explosion of broken hearts
    createHeartExplosion();
}

// Create heart explosion effect with mobile optimization
function createHeartExplosion() {
    const heartCount = window.innerWidth <= 768 ? 6 : 10; // Fewer hearts on mobile
    
    for (let i = 0; i < heartCount; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.innerHTML = '💔';
            heart.style.position = 'absolute';
            heart.style.left = '50%';
            heart.style.top = '50%';
            heart.style.fontSize = window.innerWidth <= 768 ? '2rem' : '3rem';
            heart.style.zIndex = '15';
            heart.style.pointerEvents = 'none';
            heart.style.color = '#ff1744';
            heart.style.filter = 'drop-shadow(0 0 20px rgba(255, 23, 68, 0.8))';
            
            const angle = (360 / heartCount) * i;
            const distance = window.innerWidth <= 768 ? 150 : 200 + Math.random() * 100;
            const radians = angle * Math.PI / 180;
            
            heart.style.animation = `explodeHeart${i} 2s ease-out forwards`;
            
            // Create unique explosion animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes explodeHeart${i} {
                    0% {
                        transform: translate(-50%, -50%) rotate(0deg) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) 
                                   translate(${Math.cos(radians) * distance}px, 
                                            ${Math.sin(radians) * distance}px) 
                                   rotate(720deg) scale(0);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
            
            document.body.appendChild(heart);
            
            setTimeout(() => {
                if (heart.parentNode) {
                    heart.remove();
                }
                if (style.parentNode) {
                    style.remove();
                }
            }, 2000);
        }, i * 100);
    }
}

// Create music explosion effect with mobile optimization
function createMusicExplosion(element) {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const noteCount = window.innerWidth <= 768 ? 3 : 5;
    
    for (let i = 0; i < noteCount; i++) {
        setTimeout(() => {
            const note = document.createElement('div');
            const notes = ['🎵', '🎶', '🎼', '🎤', '🎧'];
            note.innerHTML = notes[Math.floor(Math.random() * notes.length)];
            note.style.position = 'fixed';
            note.style.left = centerX + 'px';
            note.style.top = centerY + 'px';
            note.style.fontSize = window.innerWidth <= 768 ? '1.5rem' : '2rem';
            note.style.zIndex = '15';
            note.style.pointerEvents = 'none';
            note.style.color = '#ff1744';
            
            const angle = Math.random() * 360;
            const distance = window.innerWidth <= 768 ? 80 : 100 + Math.random() * 50;
            const radians = angle * Math.PI / 180;
            
            note.style.animation = `explodeNote${i}-${Date.now()} 1.5s ease-out forwards`;
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes explodeNote${i}-${Date.now()} {
                    0% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) 
                                   translate(${Math.cos(radians) * distance}px, 
                                            ${Math.sin(radians) * distance}px) 
                                   scale(0);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
            
            document.body.appendChild(note);
            
            setTimeout(() => {
                if (note.parentNode) {
                    note.remove();
                }
                if (style.parentNode) {
                    style.remove();
                }
            }, 1500);
        }, i * 150);
    }
}

// Random glitch effects with mobile consideration
setInterval(() => {
    const elements = document.querySelectorAll('.chaos-text, .image-frame');
    const randomElement = elements[Math.floor(Math.random() * elements.length)];
    if (randomElement) {
        randomElement.classList.add('glitch');
        
        setTimeout(() => {
            randomElement.classList.remove('glitch');
        }, window.innerWidth <= 768 ? 500 : 1000);
    }
}, window.innerWidth <= 768 ? 5000 : 3000);

// Preload audio on first interaction
function preloadAudioOnDemand(audioId) {
    const audio = document.getElementById(audioId);
    if (audio && audio.preload === 'none') {
        audio.preload = 'auto';
        audio.load(); // Force load
    }
}

// Mobile touch handling
function addTouchSupport() {
    const elements = document.querySelectorAll('.music-chaos, #mainHeart, .back-button, .message-icon');
    
    elements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        }, { passive: true });
        
        element.addEventListener('touchend', function() {
            this.style.transform = '';
        }, { passive: true });
    });
}

// Initialize everything when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // Add mobile touch support
    addTouchSupport();
    
    // Set up event listeners using JavaScript instead of inline onclick
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            goBackToMain();
        });
        console.log('Back button listener added');
    }
    
    const messageIcon = document.querySelector('.message-icon');
    if (messageIcon) {
        messageIcon.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showMessage();
        });
        console.log('Message icon listener added');
    }
    
    const mainHeart = document.getElementById('mainHeart');
    if (mainHeart) {
        mainHeart.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            playMainMusic();
        });
        console.log('Main heart listener added');
    }
    
    // Set up music buttons (now only 4 buttons)
    for (let i = 1; i <= 4; i++) {
        const musicBtn = document.getElementById(`musicBtn${i}`);
        if (musicBtn) {
            musicBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Music button ${i} clicked`);
                playMusic(i);
            });
            console.log(`Music button ${i} listener added`);
        }
    }
    
    // Close message modal when clicking outside
    const messageModal = document.getElementById('messageModal');
    if (messageModal) {
        messageModal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideMessage();
            }
        });
        
        // Close button for modal
        const closeMessage = document.querySelector('.close-message');
        if (closeMessage) {
            closeMessage.addEventListener('click', hideMessage);
        }
    }
    
    // Initialize audio context
    initAudioContext();
    
    // Optimize audio loading - only preload the main heart audio
    const mainAudio = document.getElementById('mainHeartAudio');
    if (mainAudio) {
        mainAudio.preload = 'auto';
    }
    
    // Set other audio files to load only when needed
    for (let i = 1; i <= 4; i++) {
        const audio = document.getElementById(`musicAudio${i}`);
        if (audio) {
            audio.preload = 'none'; // Don't preload these
            audio.volume = window.innerWidth <= 768 ? 0.4 : 0.3;
        }
    }
    
    // Show loading indicator
    showAudioStatus('🎵 Loading audio files...');
    setTimeout(() => {
        hideAudioStatus();
    }, 3000);
    
    // Handle orientation changes on mobile
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            // Recalculate positions after orientation change
            const viewport = document.querySelector('meta[name=viewport]');
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no');
        }, 500);
    });
    
    console.log('Initialization complete');
});

// Keyboard shortcuts with mobile consideration
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        hideMessage();
        stopAllAudio();
    }
    if (e.key === 'm' || e.key === 'M') {
        showMessage();
    }
    if (e.key === ' ') { // Spacebar to stop audio
        e.preventDefault();
        stopAllAudio();
    }
});

// Handle user interaction to enable audio context
document.addEventListener('click', function() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}, { once: true });

// Prevent right-click context menu for a more immersive experience
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// Add touch support for mobile devices
document.addEventListener('touchstart', function() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}, { once: true });

// Prevent zoom on double tap for mobile
document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

let lastTouchEnd = 0;