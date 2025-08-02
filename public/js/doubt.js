// Backend URL configuration - Updated for production
const BACKEND_URL = 'https://caked-production.up.railway.app'; // Updated to use your Railway URL

let currentAudio = null;
let currentPlayingElement = null;

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
function goBack() {
    stopAllAudio();
    window.location.href = 'index.html'; // Fixed: Changed from 'index.html' to ensure correct navigation
}

// Show message modal
function showMessage() {
    document.getElementById('messageModal').style.display = 'flex';
}

// Hide message modal
function hideMessage() {
    document.getElementById('messageModal').style.display = 'none';
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
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    
    // Reset all visual states
    document.querySelectorAll('.music-chaos').forEach(btn => {
        btn.classList.remove('playing');
    });
    
    const mainHeart = document.getElementById('mainHeart');
    mainHeart.classList.remove('playing');
    
    hideAudioStatus();
    currentAudio = null;
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
    
    // Try to play the audio
    const playPromise = audioElement.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            // Audio started successfully
            console.log('Audio playing:', title);
        }).catch(error => {
            console.log('Audio play failed, using Web Audio API fallback');
            playToneSequence(title, visualElement);
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
}

// Fallback: Create audio tones using Web Audio API
function playToneSequence(title, visualElement) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Create a melancholic tone sequence
        const frequencies = [220, 196, 174, 155, 138]; // A3 to C#3 - sad descending
        let currentFreq = 0;
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequencies[0], audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
        
        // Change frequency every 0.5 seconds
        const interval = setInterval(() => {
            currentFreq++;
            if (currentFreq < frequencies.length) {
                oscillator.frequency.setValueAtTime(frequencies[currentFreq], audioContext.currentTime);
            } else {
                clearInterval(interval);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
                setTimeout(() => {
                    oscillator.stop();
                    if (visualElement) {
                        visualElement.classList.remove('playing');
                    }
                    hideAudioStatus();
                }, 500);
            }
        }, 500);
        
        oscillator.start();
        
    } catch (error) {
        console.log('Web Audio API failed, showing message only');
        setTimeout(() => {
            if (visualElement) {
                visualElement.classList.remove('playing');
            }
            hideAudioStatus();
        }, 2000);
    }
}

// Music functionality
function playMusic(num) {
    const audioElement = document.getElementById(`musicAudio${num}`);
    const buttonElement = document.getElementById(`musicBtn${num}`);
    const titles = [
        "TRAUMA - PARTYNEXTDOOR",
        "Fix You - Coldplay", 
        "The Night We Met - Lord Huron",
        "Say Something - A Great Big World"
    ];
    
    playAudioWithFallback(audioElement, titles[num - 1], buttonElement);
    
    // Create explosion effect
    createMusicExplosion(buttonElement);
}

// Main heart music
function playMainMusic() {
    const audioElement = document.getElementById('mainHeartAudio');
    const heartElement = document.getElementById('mainHeart');
    
    playAudioWithFallback(audioElement, "You've been missed - PARTYNEXTDOOR", heartElement);
    
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
    randomElement.classList.add('glitch');
    
    setTimeout(() => {
        randomElement.classList.remove('glitch');
    }, 1000);
}, 3000);

// Initialize audio elements
document.addEventListener('DOMContentLoaded', function() {
    // Update all audio sources to use backend URL
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
        // Get the current source
        const source = audio.querySelector('source');
        if (source) {
            const src = source.getAttribute('src');
            // Update to use backend URL if it's a local asset
            if (src.startsWith('/assets/') || src.startsWith('assets/')) {
                const filename = src.split('/').pop();
                source.setAttribute('src', `${BACKEND_URL}/assets/audio/${filename}`);
            }
        }
        
        // Set volume for all audio elements
        audio.volume = 0.3;
        audio.loop = false;
    });
    
    // Update all image sources to use backend URL
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        const src = img.getAttribute('src');
        // Update to use backend URL if it's a local asset
        if (src.startsWith('/assets/') || src.startsWith('assets/')) {
            const filename = src.split('/').pop();
            img.setAttribute('src', `${BACKEND_URL}/assets/images/${filename}`);
        }
    });
    
    // Update video sources to use backend URL
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        const source = video.querySelector('source');
        if (source) {
            const src = source.getAttribute('src');
            // Update to use backend URL if it's a local asset
            if (src.startsWith('/assets/') || src.startsWith('assets/')) {
                const filename = src.split('/').pop();
                source.setAttribute('src', `${BACKEND_URL}/assets/videos/${filename}`);
            }
        }
    });
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
    }
    if (e.key === 'm' || e.key === 'M') {
        showMessage();
    }
});