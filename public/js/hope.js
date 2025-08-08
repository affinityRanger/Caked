// Backend URL configuration
const BACKEND_URL = 'https://caked-production.up.railway.app';

// Audio context for Web Audio API
let audioContext = null;
let currentAudio = null;
let nextAudio = null;
let currentPlayingElement = null;
let analyser = null;
let dataArray = null;
let animationId = null;
let crossfadeInterval = null;

// Feature states
let isDarkMode = true;
let cachedTracks = new Set();
let isOffline = false;

// Global music player variables
let globalMusicIndex = 0;
let globalMusicFiles = [
    'PARTYNEXTDOOR - Dreamin.mp3',
    'PARTYNEXTDOOR - DEEPER.mp3',
    'PARTYNEXTDOOR - TRAUMA .mp3',
    'KEEP IT-Juice WRLD.mp3',
    'Juice WRLD - GRACE.mp3',
    'Kiss - I Was Made For Lovin You.mp3',
    'Lovers Lane - JuiceWrld.mp3',
    'PARTYNEXTDOOR - Some Of Your Love.mp3',
    'PARTYNEXTDOOR - You ve Been Missed.mp3',
    'PARTYNEXTDOOR & Rihanna - BELIEVE IT.mp3'
];

let globalMusicTitles = [
    "Dreamin' - PARTYNEXTDOOR",
    "DEEPER - PARTYNEXTDOOR",
    "TRAUMA - PARTYNEXTDOOR",
    "KEEP IT - Juice WRLD",
    "GRACE - Juice WRLD",
    "Kiss - I Was Made For Lovin' You",
    "Lovers Lane - Juice WRLD",
    "Some Of Your Love - PARTYNEXTDOOR",
    "You've Been Missed - PARTYNEXTDOOR",
    "BELIEVE IT - PARTYNEXTDOOR & Rihanna"
];

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

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        modal.classList.remove('show');
    }
}

// FIXED: Photo enlargement functionality
function enlargePhoto(img, event) {
    if (event) {
        event.stopPropagation();
    }
    
    const modal = document.getElementById('photoModal');
    const enlargedPhoto = document.getElementById('enlargedPhoto');
    
    if (modal && enlargedPhoto && img) {
        // Set the source
        enlargedPhoto.src = img.src;
        enlargedPhoto.alt = img.alt || 'Enlarged photo';
        
        // Show modal immediately
        modal.style.display = 'flex';
        document.body.classList.add('photo-modal-open');
        
        // Add show class for animation after a brief delay
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
        
        console.log('Photo modal opened with image:', img.src);
    }
}

function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    const enlargedPhoto = document.getElementById('enlargedPhoto');
    
    if (modal) {
        modal.classList.remove('show');
        document.body.classList.remove('photo-modal-open');
        
        // Hide modal after animation completes
        setTimeout(() => {
            modal.style.display = 'none';
            if (enlargedPhoto) {
                enlargedPhoto.src = '';
            }
        }, 400);
        
        // Restore body scrolling
        document.body.style.overflow = 'auto';
    }
}

// Title click functionality
function titleClick() {
    const popup = document.getElementById('titlePopup');
    if (popup) {
        popup.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Auto close after 8 seconds
        setTimeout(() => {
            popup.classList.remove('show');
            document.body.style.overflow = 'auto';
        }, 8000);
    }
}

// Message functionality
function showSavedMessage(messageId) {
    const messageDiv = document.getElementById(messageId);
    if (messageDiv) {
        const isVisible = messageDiv.style.display === 'block';
        messageDiv.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

// Music popup functionality
function toggleMusicPopup() {
    const popup = document.getElementById('musicPopup');
    const button = document.getElementById('musicButton');
    
    if (popup && button) {
        const isVisible = popup.classList.contains('show');
        
        if (isVisible) {
            popup.classList.remove('show');
            button.classList.remove('active');
            setTimeout(() => {
                popup.style.display = 'none';
            }, 400);
        } else {
            popup.style.display = 'block';
            requestAnimationFrame(() => {
                popup.classList.add('show');
                button.classList.add('active');
            });
        }
    }
}

// Exclamation popup functionality
function toggleExclamationPopup() {
    const popup = document.getElementById('exclamationPopup');
    const button = document.getElementById('exclamationIcon');
    
    if (popup && button) {
        const isVisible = popup.classList.contains('show');
        
        if (isVisible) {
            popup.classList.remove('show');
            button.classList.remove('active');
        } else {
            popup.classList.add('show');
            button.classList.add('active');
        }
    }
}

// Global music functions
function selectGlobalSong(filename) {
    const audio = document.getElementById('globalAudio');
    const nowPlaying = document.getElementById('globalNowPlaying');
    
    if (audio && filename) {
        // Find the index of the selected song
        globalMusicIndex = globalMusicFiles.indexOf(filename);
        
        // Update audio source
        audio.src = `${BACKEND_URL}/assets/audio/${filename}`;
        
        // Update now playing display
        if (nowPlaying) {
            nowPlaying.textContent = globalMusicTitles[globalMusicIndex];
        }
        
        // Update select dropdown
        const select = document.getElementById('globalMusicSelect');
        if (select) {
            select.value = filename;
        }
        
        console.log('Selected song:', filename);
    }
}

function toggleGlobalMusic() {
    const audio = document.getElementById('globalAudio');
    const playBtn = document.getElementById('globalPlayBtn');
    const musicButton = document.getElementById('musicButton');
    
    if (audio && playBtn) {
        if (audio.paused) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    playBtn.textContent = '⏸️';
                    if (musicButton) {
                        musicButton.classList.add('playing');
                    }
                }).catch(error => {
                    console.log('Audio play failed:', error);
                });
            }
        } else {
            audio.pause();
            playBtn.textContent = '▶️';
            if (musicButton) {
                musicButton.classList.remove('playing');
            }
        }
    }
}

function playPreviousSong() {
    globalMusicIndex = (globalMusicIndex - 1 + globalMusicFiles.length) % globalMusicFiles.length;
    selectGlobalSong(globalMusicFiles[globalMusicIndex]);
    
    const audio = document.getElementById('globalAudio');
    if (audio && !audio.paused) {
        audio.play();
    }
}

function playNextSong() {
    globalMusicIndex = (globalMusicIndex + 1) % globalMusicFiles.length;
    selectGlobalSong(globalMusicFiles[globalMusicIndex]);
    
    const audio = document.getElementById('globalAudio');
    if (audio && !audio.paused) {
        audio.play();
    }
}

function stopGlobalMusic() {
    const audio = document.getElementById('globalAudio');
    const playBtn = document.getElementById('globalPlayBtn');
    const musicButton = document.getElementById('musicButton');
    
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
        if (playBtn) {
            playBtn.textContent = '▶️';
        }
        if (musicButton) {
            musicButton.classList.remove('playing');
        }
    }
}

// Create stars background
function createStars() {
    const starsContainer = document.getElementById('stars');
    if (!starsContainer) return;
    
    // Clear existing stars
    starsContainer.innerHTML = '';
    
    const starCount = window.innerWidth <= 768 ? 50 : 100;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Random position
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        
        // Random size
        const size = Math.random() * 3 + 1;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        
        // Random animation delay
        star.style.animationDelay = Math.random() * 3 + 's';
        
        starsContainer.appendChild(star);
    }
}

// Initialize loading screen
function initLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        // Hide loading screen after 3 seconds
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 1000);
        }, 3000);
    }
}

// Image loading optimization
function optimizeImageLoading() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.complete) {
            img.addEventListener('load', function() {
                this.style.opacity = '1';
            });
            img.addEventListener('error', function() {
                console.log('Image failed to load:', this.src);
                // Add placeholder or fallback behavior here
            });
        }
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing hope page...');
    
    // Initialize loading screen
    initLoadingScreen();
    
    // Create stars background
    createStars();
    
    // Initialize audio context
    initAudioContext();
    
    // Optimize image loading
    optimizeImageLoading();
    
    // Set up global audio
    const globalAudio = document.getElementById('globalAudio');
    if (globalAudio) {
        globalAudio.volume = 0.3;
        globalAudio.addEventListener('ended', function() {
            playNextSong(); // Auto play next song
        });
        
        // Set initial song
        selectGlobalSong(globalMusicFiles[0]);
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        // Close photo modal when clicking on modal background
        const photoModal = document.getElementById('photoModal');
        if (event.target === photoModal) {
            closePhotoModal();
        }
        
        // Close regular modals
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        // Close title popup when clicking outside
        const titlePopup = document.getElementById('titlePopup');
        if (event.target === titlePopup) {
            titlePopup.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
        
        // Close music popup when clicking outside
        const musicPopup = document.getElementById('musicPopup');
        if (musicPopup && !musicPopup.contains(event.target) && 
            !document.getElementById('musicButton').contains(event.target)) {
            if (musicPopup.classList.contains('show')) {
                toggleMusicPopup();
            }
        }
        
        // Close exclamation popup when clicking outside
        const exclamationPopup = document.getElementById('exclamationPopup');
        if (exclamationPopup && !exclamationPopup.contains(event.target) && 
            !document.getElementById('exclamationIcon').contains(event.target)) {
            if (exclamationPopup.classList.contains('show')) {
                toggleExclamationPopup();
            }
        }
    });
    
    // Handle escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            // Close photo modal
            const photoModal = document.getElementById('photoModal');
            if (photoModal && photoModal.classList.contains('show')) {
                closePhotoModal();
                return;
            }
            
            // Close other popups
            const titlePopup = document.getElementById('titlePopup');
            if (titlePopup && titlePopup.classList.contains('show')) {
                titlePopup.classList.remove('show');
                document.body.style.overflow = 'auto';
                return;
            }
            
            const musicPopup = document.getElementById('musicPopup');
            if (musicPopup && musicPopup.classList.contains('show')) {
                toggleMusicPopup();
                return;
            }
            
            const exclamationPopup = document.getElementById('exclamationPopup');
            if (exclamationPopup && exclamationPopup.classList.contains('show')) {
                toggleExclamationPopup();
                return;
            }
            
            // Close regular modals
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display === 'block') {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
        }
        
        // Space bar controls for global music
        if (event.key === ' ' && !event.target.matches('input, textarea, select')) {
            event.preventDefault();
            toggleGlobalMusic();
        }
    });
    
    // Handle user interaction to enable audio context
    document.addEventListener('click', function() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }, { once: true });
    
    // Mobile optimizations
    if (window.innerWidth <= 768) {
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Add touch support for audio context
        document.addEventListener('touchstart', function() {
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }, { once: true });
    }
    
    console.log('Hope page initialization complete');
});

// Handle orientation change
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        createStars(); // Recreate stars for new viewport
    }, 500);
});

// Handle resize
window.addEventListener('resize', function() {
    // Recreate stars on significant size changes
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
        createStars();
    }, 250);
});

// Prevent right-click context menu
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});