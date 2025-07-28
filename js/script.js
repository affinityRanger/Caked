// Global variables
const globalAudio = document.getElementById("globalAudio");
const musicButton = document.getElementById("musicButton");
const musicPopup = document.getElementById("musicPopup");
let musicPopupVisible = false;
let currentSong = "song1.mp3";

// Audio objects for each song (from your original script.js)
let audioPlayers = {};

// Initialize everything when page loads
window.addEventListener('load', function() {
    // Set up audio for auto-play
    globalAudio.src = `assets/audio/${currentSong}`;
    globalAudio.volume = 0.4;
    
    // Initialize audio players
    initAudio();
    
    // Start loading screen
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
            initializeBackground();
            // Auto-play music after loading screen
            startAutoPlay();
        }, 1000);
    }, 2000);
});

// Initialize audio players (from your original script.js)
function initAudio() {
    audioPlayers = {
        1: new Audio('assets/audio/song1.mp3'),
        2: new Audio('assets/audio/song2.mp3'),
        3: new Audio('assets/audio/song3.mp3')
    };

    Object.values(audioPlayers).forEach(audio => {
        audio.loop = false;
        audio.volume = 0.7;
    });
}

// Auto-play function
function startAutoPlay() {
    globalAudio.play().then(() => {
        musicButton.classList.add('playing');
        document.getElementById('globalPlayBtn').textContent = '⏸️ Pause';
        document.getElementById('globalNowPlaying').textContent = `Playing: ${getSongDisplayName(currentSong)}`;
        // Set the select dropdown to show current song
        document.getElementById('globalMusicSelect').value = currentSong;
    }).catch(error => {
        console.log('Auto-play failed, user interaction required:', error);
        // If auto-play fails, show a subtle indicator
        document.getElementById('globalNowPlaying').textContent = 'Click play to start music';
    });
}

// Get display name for song
function getSongDisplayName(songFile) {
    const songNames = {
        'song1.mp3': 'Dreamin\' - PARTYNEXTDOOR',
        'song2.mp3': 'Best Part - Daniel Caesar',
        'song3.mp3': 'Golden - Jill Scott',
        'song4.mp3': 'Adorn - Miguel',
        'song5.mp3': 'Come Through - H.E.R.',
        'song6.mp3': 'Stay Ready - Jhené Aiko',
        'song7.mp3': 'Love Galore - SZA'
    };
    return songNames[songFile] || songFile.replace('.mp3', '');
}

// Music popup toggle
function toggleMusicPopup() {
    musicPopupVisible = !musicPopupVisible;
    if (musicPopupVisible) {
        musicPopup.classList.add('show');
    } else {
        musicPopup.classList.remove('show');
    }
}

// Global music functions
function selectGlobalSong(songFile) {
    if (songFile) {
        const wasPlaying = !globalAudio.paused;
        
        globalAudio.src = `assets/audio/${songFile}`;
        globalAudio.volume = 0.4;
        currentSong = songFile;
        
        if (wasPlaying) {
            globalAudio.play().then(() => {
                document.getElementById('globalNowPlaying').textContent = `Playing: ${getSongDisplayName(songFile)}`;
            });
        } else {
            document.getElementById('globalNowPlaying').textContent = `Ready: ${getSongDisplayName(songFile)}`;
        }
    }
}

function toggleGlobalMusic() {
    if (globalAudio.paused) {
        globalAudio.play().then(() => {
            musicButton.classList.add('playing');
            document.getElementById('globalPlayBtn').textContent = '⏸️ Pause';
            document.getElementById('globalNowPlaying').textContent = `Playing: ${getSongDisplayName(currentSong)}`;
        }).catch(error => {
            console.log('Music play failed:', error);
        });
    } else {
        globalAudio.pause();
        musicButton.classList.remove('playing');
        document.getElementById('globalPlayBtn').textContent = '▶️ Play';
        document.getElementById('globalNowPlaying').textContent = `Paused: ${getSongDisplayName(currentSong)}`;
    }
}

function stopGlobalMusic() {
    globalAudio.pause();
    globalAudio.currentTime = 0;
    musicButton.classList.remove('playing');
    document.getElementById('globalPlayBtn').textContent = '▶️ Play';
    document.getElementById('globalNowPlaying').textContent = `Stopped: ${getSongDisplayName(currentSong)}`;
}

// Play/pause song for a rose (from your original script.js)
function playMusic(songNumber, event) {
    const audio = audioPlayers[songNumber];
    const button = event?.target.closest('.play-btn');

    if (!audio) {
        const messages = [
            "🎵 Playing: 'The Way You Look Tonight' 🎵",
            "🎶 Playing: 'Your Song' by Elton John 🎶",
            "🎼 Playing: 'Perfect' by Ed Sheeran 🎼"
        ];
        alert(messages[songNumber - 1] + "\n\n(Add your audio files to assets/audio/ folder!)");
        return;
    }

    stopAllAudio();

    if (audio.paused) {
        audio.play().then(() => {
            if (button) {
                button.innerHTML = '<span class="music-note">⏸️</span> Pause Music <span class="music-note">⏸️</span>';
            }

            audio.onended = () => {
                if (button) {
                    if (songNumber === 1)
                        button.innerHTML = '<span class="music-note">🎵</span> Play Our Song <span class="music-note">🎵</span>';
                    else if (songNumber === 2)
                        button.innerHTML = '<span class="music-note">🎶</span> Feel the Rhythm <span class="music-note">🎶</span>';
                    else if (songNumber === 3)
                        button.innerHTML = '<span class="music-note">🎼</span> Our Forever Song <span class="music-note">🎼</span>';
                }
            };
        }).catch(error => {
            console.log('Audio playback failed:', error);
            const fallback = [
                "🎵 Add 'song1.mp3' to assets/audio/ folder 🎵",
                "🎶 Add 'song2.mp3' to assets/audio/ folder 🎶",
                "🎼 Add 'song3.mp3' to assets/audio/ folder 🎼"
            ];
            alert(fallback[songNumber - 1]);
        });
    } else {
        audio.pause();
        audio.currentTime = 0;

        if (button) {
            if (songNumber === 1)
                button.innerHTML = '<span class="music-note">🎵</span> Play Our Song <span class="music-note">🎵</span>';
            else if (songNumber === 2)
                button.innerHTML = '<span class="music-note">🎶</span> Feel the Rhythm <span class="music-note">🎶</span>';
            else if (songNumber === 3)
                button.innerHTML = '<span class="music-note">🎼</span> Our Forever Song <span class="music-note">🎼</span>';
        }
    }
}

// Stop all audio (from your original script.js)
function stopAllAudio() {
    Object.values(audioPlayers).forEach(audio => {
        if (audio && !audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
}

// Initialize background elements
function initializeBackground() {
    createStars();
    addRoseClickEffects();
    setupEventListeners();
}

// Create twinkling stars
function createStars() {
    const starsContainer = document.getElementById('stars');
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.width = star.style.height = Math.random() * 3 + 1 + 'px';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
    }
}

// Rose click bounce effect (from your original script.js)
function addRoseClickEffects() {
    document.querySelectorAll('.rose-wrapper').forEach((rose, index) => {
        rose.addEventListener('click', function(e) {
            // Don't trigger modal if clicking upload button
            if (e.target.classList.contains('rose-upload-btn')) {
                return;
            }
            
            this.style.transform = 'scale(1.2)';
            setTimeout(() => {
                this.style.transform = 'scale(1.1)';
            }, 200);
            
            // Open corresponding modal
            openModal(`modal${index + 1}`);
        });
    });
}

// Setup all event listeners
function setupEventListeners() {
    // Music button click
    musicButton.addEventListener('click', toggleMusicPopup);
    
    // Close popup button
    document.querySelector('.close-popup').addEventListener('click', toggleMusicPopup);
    
    // Global music select
    document.getElementById('globalMusicSelect').addEventListener('change', function() {
        selectGlobalSong(this.value);
    });
    
    // Global play button
    document.getElementById('globalPlayBtn').addEventListener('click', toggleGlobalMusic);
    
    // Global stop button
    document.querySelector('.background-controls button:last-child').addEventListener('click', stopGlobalMusic);
    
    // Title click
    document.querySelector('.title').addEventListener('click', titleClick);
    
    // Rose upload buttons
    document.querySelectorAll('.rose-upload-btn').forEach((btn, index) => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            document.getElementById(`rosePhoto${index + 1}`).click();
        });
    });
    
    // Rose photo inputs
    document.querySelectorAll('[id^="rosePhoto"]').forEach((input, index) => {
        input.addEventListener('change', function() {
            loadRosePhoto(this, index + 1);
        });
    });
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach((closeBtn, index) => {
        closeBtn.addEventListener('click', function() {
            closeModal(`modal${index + 1}`);
        });
    });
    
    // Add message buttons
    document.querySelectorAll('.add-message-btn').forEach((btn, index) => {
        btn.addEventListener('click', function() {
            showSavedMessage(`msg${index + 1}`);
        });
    });
    
    // Footer message icon
    document.querySelector('.message-icon').addEventListener('click', function() {
        showSavedMessage('msg4');
    });
    
    // Photo upload handlers in modals
    document.querySelectorAll('.photo-placeholder input').forEach((input, index) => {
        input.addEventListener('change', function() {
            const photo = this.parentElement.nextElementSibling;
            loadPhoto(this, photo);
        });
    });
    
    // Close popup when clicking outside
    document.addEventListener('click', function(event) {
        if (!musicButton.contains(event.target) && !musicPopup.contains(event.target)) {
            musicPopup.classList.remove('show');
            musicPopupVisible = false;
        }
    });
    
    // Modal background click to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(event) {
            if (event.target === this) {
                this.style.display = 'none';
                stopAllAudio();
            }
        });
    });
    
    // ESC key to close modals
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                if (modal.style.display === 'block') {
                    modal.style.display = 'none';
                }
            });
            stopAllAudio();
        }
    });
}

// Handle music ended event
globalAudio.addEventListener('ended', () => {
    musicButton.classList.remove('playing');
    document.getElementById('globalPlayBtn').textContent = '▶️ Play';
    document.getElementById('globalNowPlaying').textContent = `Finished: ${getSongDisplayName(currentSong)}`;
});

// Photo loading function for modal photos
function loadPhoto(input, photoElement) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const placeholder = input.parentElement;
            
            photoElement.src = e.target.result;
            photoElement.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Rose image loading (for main roses)
function loadRosePhoto(input, roseNumber) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const roseImg = document.getElementById(`rose${roseNumber}Image`);
            const roseEmoji = document.getElementById(`rose${roseNumber}Emoji`);
            
            roseImg.src = e.target.result;
            roseImg.style.display = 'block';
            roseEmoji.style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Modal functions
function openModal(id) {
    document.getElementById(id).style.display = "block";
    createSparkles();
    stopAllAudio();
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
    stopAllAudio();
}

// Show saved message function
function showSavedMessage(messageId) {
    const msg = document.getElementById(messageId);
    if (msg) {
        msg.style.display = 'block';
        // Add a gentle scroll to the message
        setTimeout(() => {
            msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

// Title click functionality - Small thought bubble
function titleClick() {
    const popup = document.getElementById('titlePopup');
    
    if (popup.classList.contains('show')) {
        popup.classList.remove('show');
    } else {
        popup.classList.add('show');
        // Auto-hide after 3 seconds
        setTimeout(() => {
            popup.classList.remove('show');
        }, 3000);
    }
    
    // Add a special effect to the title
    const title = document.querySelector('.title');
    title.style.transform = 'scale(1.1)';
    title.style.textShadow = '0 0 30px rgba(255,255,255,1)';
    
    setTimeout(() => {
        title.style.transform = 'scale(1)';
        title.style.textShadow = '2px 2px 10px rgba(0,0,0,0.3)';
    }, 300);
}

// Sparkle effects (from your original script.js)
function createSparkles() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.innerHTML = '✨';
            sparkle.style.left = Math.random() * 100 + '%';
            sparkle.style.top = Math.random() * 100 + '%';
            sparkle.style.position = 'fixed';
            sparkle.style.zIndex = '1001';
            sparkle.style.fontSize = '2rem';
            sparkle.style.pointerEvents = 'none';
            sparkle.style.animation = 'sparkleFloat 2s ease-out forwards';
            document.body.appendChild(sparkle);

            setTimeout(() => sparkle.remove(), 2000);
        }, i * 200);
    }
}

// Add sparkle animation CSS
const sparkleStyle = document.createElement('style');
sparkleStyle.textContent = `
    @keyframes sparkleFloat {
        0% {
            opacity: 1;
            transform: translateY(0) scale(0);
        }
        50% {
            opacity: 1;
            transform: translateY(-50px) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateY(-100px) scale(0);
        }
    }
`;
document.head.appendChild(sparkleStyle);

// Image error handling (from your original script.js)
function handleImageError(img) {
    img.style.display = 'none';
    if (img.nextElementSibling?.classList.contains('photo-placeholder')) {
        img.nextElementSibling.style.display = 'flex';
    }
}

// Initialize audio elements
document.addEventListener('DOMContentLoaded', function() {
    globalAudio.volume = 0.4;
    globalAudio.loop = true;
    
    // Handle image loading errors
    document.querySelectorAll('.photo').forEach(img => {
        img.addEventListener('error', () => handleImageError(img));
        img.addEventListener('load', () => {
            if (img.nextElementSibling?.classList.contains('photo-placeholder')) {
                img.nextElementSibling.style.display = 'none';
            }
        });
    });
});

// Preload images (from your original script.js)
function preloadImages() {
    const imageUrls = [
        'assets/images/photo1.jpg',
        'assets/images/photo2.jpg',
        'assets/images/photo3.jpg',
        'assets/images/photo4.jpg',
        'assets/images/photo5.jpg',
        'assets/images/photo6.jpg'
    ];

    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

window.addEventListener('load', preloadImages);