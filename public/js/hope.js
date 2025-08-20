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

// Audio visualization variables - ADDED
let visualizerAnalyser = null;
let visualizerDataArray = null;
let visualizerAnimationId = null;
let visualizerBars = [];
let visualizerSource = null;

// Feature states
let isDarkMode = true;
let cachedTracks = new Set();
let isOffline = false;
// Auto-play attempt flag
let autoPlayAttempted = false;
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
    'Juicw WRLD - Toxic Hotel Room.mp3',
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
    "Toxic Hotel Room - Juice WRLD",
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

// ADDED: Create background visualizer
function createBackgroundVisualizer() {
    const visualizerHTML = `
        <div id="backgroundVisualizer" class="background-visualizer">
            <div class="visualizer-bars">
                ${Array(50).fill().map((_, i) => `<div class="bg-bar" id="bgBar-${i}"></div>`).join('')}
            </div>
            <div class="bg-song-info">
                <div class="bg-song-title" id="bgSongTitle">♪ No Music Playing ♪</div>
                <div class="bg-song-artist" id="bgSongArtist">Start your music to see the visualizer</div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', visualizerHTML);
}

// ADDED: Initialize background visualizer
function initBackgroundVisualizer() {
    const audio = document.getElementById('globalAudio');
    if (!audio || !audioContext) return;
    
    try {
        if (!visualizerSource) {
            visualizerSource = audioContext.createMediaElementSource(audio);
        }
        
        visualizerAnalyser = audioContext.createAnalyser();
        visualizerAnalyser.fftSize = 128;
        visualizerAnalyser.smoothingTimeConstant = 0.8;
        
        const bufferLength = visualizerAnalyser.frequencyBinCount;
        visualizerDataArray = new Uint8Array(bufferLength);
        
        visualizerSource.connect(visualizerAnalyser);
        visualizerAnalyser.connect(audioContext.destination);
        
        visualizerBars = Array.from(document.querySelectorAll('.bg-bar'));
        
        console.log('Background visualizer initialized');
    } catch (error) {
        console.log('Error initializing background visualizer:', error);
    }
}

// ADDED: Animate background visualizer
function animateBackgroundVisualizer() {
    if (!visualizerAnalyser || !visualizerDataArray || !visualizerBars.length) return;
    
    visualizerAnalyser.getByteFrequencyData(visualizerDataArray);
    
    for (let i = 0; i < visualizerBars.length && i < visualizerDataArray.length; i++) {
        const bar = visualizerBars[i];
        const value = visualizerDataArray[i] || 0;
        const height = Math.max(10, (value / 255) * 150);
        
        bar.style.height = `${height}px`;
        
        const hue = (i / visualizerBars.length) * 360;
        const intensity = value / 255;
        bar.style.background = `linear-gradient(to top, 
            hsla(${hue}, 70%, ${40 + intensity * 30}%, 0.6), 
            hsla(${(hue + 60) % 360}, 70%, ${50 + intensity * 20}%, 0.4))`;
        bar.style.opacity = Math.max(0.3, intensity * 0.8);
    }
    
    visualizerAnimationId = requestAnimationFrame(animateBackgroundVisualizer);
}

// ADDED: Start/Stop background visualizer
function startBackgroundVisualizer() {
    const visualizer = document.getElementById('backgroundVisualizer');
    if (visualizer) {
        visualizer.classList.add('active');
    }
    if (visualizerAnimationId) {
        cancelAnimationFrame(visualizerAnimationId);
    }
    animateBackgroundVisualizer();
}

function stopBackgroundVisualizer() {
    const visualizer = document.getElementById('backgroundVisualizer');
    if (visualizer) {
        visualizer.classList.remove('active');
    }
    if (visualizerAnimationId) {
        cancelAnimationFrame(visualizerAnimationId);
        visualizerAnimationId = null;
    }
    
    visualizerBars.forEach(bar => {
        bar.style.height = '10px';
        bar.style.opacity = '0.3';
        bar.style.background = 'rgba(255, 255, 255, 0.2)';
    });
}

// ADDED: Update background song info
function updateBackgroundSongInfo() {
    const titleElement = document.getElementById('bgSongTitle');
    const artistElement = document.getElementById('bgSongArtist');
    
    if (titleElement && artistElement) {
        const currentTitle = globalMusicTitles[globalMusicIndex];
        const parts = currentTitle.split(' - ');
        
        if (parts.length >= 2) {
            titleElement.textContent = parts[0];
            artistElement.textContent = parts[1];
        } else {
            titleElement.textContent = currentTitle;
            artistElement.textContent = 'Unknown Artist';
        }
    }
}

// Attempt to start music automatically
function attemptAutoPlay() {
    if (autoPlayAttempted) return;
    autoPlayAttempted = true;
    
    const audio = document.getElementById('globalAudio');
    const playBtn = document.getElementById('globalPlayBtn');
    const musicButton = document.getElementById('musicButton');
    
    if (audio) {
        // Set volume and prepare audio
        audio.volume = 0.3;
        
        // Try to play
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('Auto-play successful');
                if (playBtn) {
                    playBtn.textContent = '⏸️';
                }
                if (musicButton) {
                    musicButton.classList.add('playing');
                }
                startBackgroundVisualizer(); // ADDED
            }).catch(error => {
                console.log('Auto-play blocked by browser:', error);
                // Show a subtle indicator that user can start music
                if (musicButton) {
                    musicButton.classList.add('pulse');
                }
            });
        }
    }
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
// Global music functions - FIXED VERSION
function selectGlobalSong(filename) {
    const audio = document.getElementById('globalAudio');
    const nowPlaying = document.getElementById('globalNowPlaying');
    
    if (!audio || !filename) {
        console.log('Audio element or filename not found');
        return;
    }
    
    // Find the index of the selected song
    globalMusicIndex = globalMusicFiles.indexOf(filename);
    
    // Pause the current audio and reset time
    audio.pause();
    audio.currentTime = 0;
    
    // Update audio source
    audio.src = `${BACKEND_URL}/assets/audio/${filename}`;
    
    // Load the new source (this is critical)
    audio.load();
    
    // Update now playing display
    if (nowPlaying) {
        nowPlaying.textContent = globalMusicTitles[globalMusicIndex];
    }
    
    updateBackgroundSongInfo(); // ADDED
    
    // Update select dropdown
    const select = document.getElementById('globalMusicSelect');
    if (select) {
        select.value = filename;
    }
    
    console.log('Selected song:', filename);
}

function toggleGlobalMusic() {
    const audio = document.getElementById('globalAudio');
    const playBtn = document.getElementById('globalPlayBtn');
    const musicButton = document.getElementById('musicButton');
    
    if (audio && playBtn) {
        if (audio.paused) {
            // Check if audio is ready to play
            if (audio.readyState >= HTMLAudioElement.HAVE_ENOUGH_DATA) {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        playBtn.textContent = '⏸️';
                        if (musicButton) {
                            musicButton.classList.add('playing');
                            musicButton.classList.remove('pulse');
                        }
                        startBackgroundVisualizer(); // ADDED
                    }).catch(error => {
                        console.log('Audio play failed:', error);
                    });
                }
            } else {
                // Wait for audio to be loaded before playing
                audio.addEventListener('canplay', function onCanPlay() {
                    audio.removeEventListener('canplay', onCanPlay);
                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            playBtn.textContent = '⏸️';
                            if (musicButton) {
                                musicButton.classList.add('playing');
                                musicButton.classList.remove('pulse');
                            }
                            startBackgroundVisualizer(); // ADDED
                        }).catch(error => {
                            console.log('Audio play failed:', error);
                        });
                    }
                });
            }
        } else {
            audio.pause();
            playBtn.textContent = '▶️';
            if (musicButton) {
                musicButton.classList.remove('playing');
            }
            stopBackgroundVisualizer(); // ADDED
        }
    }
}

function playPreviousSong() {
    globalMusicIndex = (globalMusicIndex - 1 + globalMusicFiles.length) % globalMusicFiles.length;
    selectGlobalSong(globalMusicFiles[globalMusicIndex]);
    
    const audio = document.getElementById('globalAudio');
    const playBtn = document.getElementById('globalPlayBtn');
    const musicButton = document.getElementById('musicButton');
    
    if (audio) {
        // Check if audio is ready to play
        if (audio.readyState >= HTMLAudioElement.HAVE_ENOUGH_DATA) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    if (playBtn) playBtn.textContent = '⏸️';
                    if (musicButton) {
                        musicButton.classList.add('playing');
                        musicButton.classList.remove('pulse');
                    }
                    startBackgroundVisualizer(); // ADDED
                }).catch(error => {
                    console.log('Audio play failed:', error);
                });
            }
        } else {
            // Wait for audio to be loaded before playing
            audio.addEventListener('canplay', function onCanPlay() {
                audio.removeEventListener('canplay', onCanPlay);
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        if (playBtn) playBtn.textContent = '⏸️';
                        if (musicButton) {
                            musicButton.classList.add('playing');
                            musicButton.classList.remove('pulse');
                        }
                        startBackgroundVisualizer(); // ADDED
                    }).catch(error => {
                        console.log('Audio play failed:', error);
                    });
                }
            });
        }
    }
}

function playNextSong() {
    globalMusicIndex = (globalMusicIndex + 1) % globalMusicFiles.length;
    selectGlobalSong(globalMusicFiles[globalMusicIndex]);
    
    const audio = document.getElementById('globalAudio');
    const playBtn = document.getElementById('globalPlayBtn');
    const musicButton = document.getElementById('musicButton');
    
    if (audio) {
        // Check if audio is ready to play
        if (audio.readyState >= HTMLAudioElement.HAVE_ENOUGH_DATA) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    if (playBtn) playBtn.textContent = '⏸️';
                    if (musicButton) {
                        musicButton.classList.add('playing');
                        musicButton.classList.remove('pulse');
                    }
                    startBackgroundVisualizer(); // ADDED
                }).catch(error => {
                    console.log('Audio play failed:', error);
                });
            }
        } else {
            // Wait for audio to be loaded before playing
            audio.addEventListener('canplay', function onCanPlay() {
                audio.removeEventListener('canplay', onCanPlay);
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        if (playBtn) playBtn.textContent = '⏸️';
                        if (musicButton) {
                            musicButton.classList.add('playing');
                            musicButton.classList.remove('pulse');
                        }
                        startBackgroundVisualizer(); // ADDED
                    }).catch(error => {
                        console.log('Audio play failed:', error);
                    });
                }
            });
        }
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
        stopBackgroundVisualizer(); // ADDED
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
                // Try to start music after loading screen disappears
                setTimeout(() => {
                    attemptAutoPlay();
                }, 500);
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
    
    // Create background visualizer - ADDED
    createBackgroundVisualizer();
    
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
        
        // Explicitly load the audio
        globalAudio.load();
        
        // Try to load the audio
        globalAudio.addEventListener('loadeddata', function() {
            console.log('Audio loaded and ready');
        });
        
        // Handle audio errors
        globalAudio.addEventListener('error', function(e) {
            console.log('Audio error:', e);
        });
        
        // Initialize background visualizer when audio can play - ADDED
        globalAudio.addEventListener('canplay', function() {
            if (!visualizerAnalyser) {
                initBackgroundVisualizer();
            }
        });
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
    
    // Handle user interaction to enable audio context and try autoplay
    function handleUserInteraction() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        // Try to start music on first user interaction
        if (!autoPlayAttempted) {
            attemptAutoPlay();
        }
        // Initialize visualizer if not already done - ADDED
        if (!visualizerAnalyser && audioContext) {
            setTimeout(() => {
                initBackgroundVisualizer();
            }, 100);
        }
    }
    
    // Add event listeners for user interaction
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    
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