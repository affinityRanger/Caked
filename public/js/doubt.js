// Audio context for Web Audio API (keeping for potential future use)
let audioContext = null;
let currentAudio = null;
let currentPlayingElement = null;

// Initialize audio context (keeping for compatibility)
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
        alert('Navigate back to your main page');
    }
}

// Show message modal
function showMessage() {
    document.getElementById('messageModal').style.display = 'flex';
}

// Hide message modal
function hideMessage() {
    document.getElementById('messageModal').style.display = 'none';
}

// Handle image upload
function handleImageUpload(frameNum, input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const frame = document.getElementById(`imageFrame${frameNum}`);
            const placeholder = frame.querySelector('.placeholder');
            
            // Create img element if it doesn't exist
            let img = frame.querySelector('img');
            if (!img) {
                img = document.createElement('img');
                img.alt = 'Uploaded memory';
                frame.appendChild(img);
            }
            
            img.src = e.target.result;
            img.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

// Show placeholder if image fails to load
function showPlaceholder(num) {
    const frame = document.getElementById(`imageFrame${num}`);
    const img = frame.querySelector('img');
    const placeholder = frame.querySelector('.placeholder');
    
    if (img) img.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
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
        btn.classList.remove('playing');
    });
    
    const mainHeart = document.getElementById('mainHeart');
    if (mainHeart) {
        mainHeart.classList.remove('playing');
    }
    
    hideAudioStatus();
    currentPlayingElement = null;
}

// Show audio status
function showAudioStatus(message) {
    const status = document.getElementById('audioStatus');
    status.textContent = message;
    status.classList.add('show');
}

// Hide audio status
function hideAudioStatus() {
    const status = document.getElementById('audioStatus');
    status.classList.remove('show');
}

// Play audio with fallback
function playAudioWithFallback(audioElement, title, visualElement) {
    stopAllAudio();
    
    currentAudio = audioElement;
    currentPlayingElement = visualElement;
    
    // Add visual feedback
    if (visualElement) {
        visualElement.classList.add('playing');
    }
    
    showAudioStatus(`🎵 ${title}`);
    
    // Set volume
    audioElement.volume = 0.3;
    
    // Try to play the audio
    const playPromise = audioElement.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            // Audio started successfully
            console.log('Audio playing:', title);
        }).catch(error => {
            console.log('Audio play failed:', error);
            showAudioStatus(`🎵 ${title} (Loading...)`);
        });
    }
    
    // Handle audio end
    audioElement.onended = () => {
        if (visualElement) {
            visualElement.classList.remove('playing');
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
                visualElement.classList.remove('playing');
            }
            hideAudioStatus();
        }, 2000);
    };
}

// Music functionality
function playMusic(num) {
    const audioElement = document.getElementById(`musicAudio${num}`);
    const buttonElement = document.getElementById(`musicBtn${num}`);
    const titles = [
        "TRAUMA - PARTYNEXTDOOR",
        "DEEPER - PARTYNEXTDOOR", 
        "Dreamin - PARTYNEXTDOOR",
        "Some Of Your Love - PARTYNEXTDOOR"
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

// Create heart explosion effect
function createHeartExplosion() {
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.innerHTML = '💔';
            heart.style.position = 'absolute';
            heart.style.left = '50%';
            heart.style.top = '50%';
            heart.style.fontSize = '3rem';
            heart.style.zIndex = '15';
            heart.style.pointerEvents = 'none';
            heart.style.color = '#ff1744';
            heart.style.filter = 'drop-shadow(0 0 20px rgba(255, 23, 68, 0.8))';
            
            const angle = (360 / 10) * i;
            const distance = 200 + Math.random() * 100;
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

// Create music explosion effect
function createMusicExplosion(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const note = document.createElement('div');
            const notes = ['🎵', '🎶', '🎼', '🎤', '🎧'];
            note.innerHTML = notes[Math.floor(Math.random() * notes.length)];
            note.style.position = 'fixed';
            note.style.left = centerX + 'px';
            note.style.top = centerY + 'px';
            note.style.fontSize = '2rem';
            note.style.zIndex = '15';
            note.style.pointerEvents = 'none';
            note.style.color = '#ff1744';
            
            const angle = Math.random() * 360;
            const distance = 100 + Math.random() * 50;
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

// Random glitch effects
setInterval(() => {
    const elements = document.querySelectorAll('.chaos-text, .image-frame');
    const randomElement = elements[Math.floor(Math.random() * elements.length)];
    if (randomElement) {
        randomElement.classList.add('glitch');
        
        setTimeout(() => {
            randomElement.classList.remove('glitch');
        }, 1000);
    }
}, 3000);

// Add click handlers for image frames to trigger file input
document.addEventListener('DOMContentLoaded', function() {
    // Add click handlers for image upload
    for (let i = 1; i <= 5; i++) {
        const frame = document.getElementById(`imageFrame${i}`);
        const fileInput = document.getElementById(`fileInput${i}`);
        
        if (frame && fileInput) {
            frame.addEventListener('click', () => {
                fileInput.click();
            });
        }
    }
});

// Close message modal when clicking outside
document.getElementById('messageModal').addEventListener('click', function(e) {
    if (e.target === this) {
        hideMessage();
    }
});

// Keyboard shortcuts
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

// Initialize audio context on page load
window.addEventListener('load', function() {
    initAudioContext();
});